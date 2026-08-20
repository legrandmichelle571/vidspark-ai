/**
 * Liaison (pairing) de l'extension VidSpark — COUCHE FINE par-dessus le vrai
 * système d'activation (routes/activation.js), pas un remplacement.
 *
 * Ce fichier ne fait QU'UNE chose : résoudre un user_id (via handshake
 * nonce/state ou code de secours à usage unique) et restituer le credential
 * activation_codes STABLE et EXISTANT de cet utilisateur (find-or-create,
 * jamais delete+insert). Il n'écrit JAMAIS dans activation_devices ni
 * activation_channels — c'est strictement le rôle de POST /api/activation/activate
 * (routes/activation.js, non modifié), que l'extension appelle elle-même
 * juste après avoir reçu ce credential, avec son propre device_id.
 *
 * Flux A — handshake automatique (site → extension) :
 *   POST /handshake/start     (site, requireAuth)   { challenge } → { state }
 *   POST /handshake/complete  (extension, public)    { nonce, state } → credential
 *
 * Flux B — code de secours à un seul champ :
 *   POST /pair/manual-code    (site, requireAuth)   → { code, expires_in }
 *   POST /pair/redeem         (extension, public)    { code } → credential
 *
 * Sécurité : nonce généré et gardé côté extension (jamais transmis en clair au
 * site — seul son empreinte sha256 "challenge" transite par le site), state
 * aléatoire 256 bits à usage unique, expiration courte, consommation atomique
 * (UPDATE ... WHERE status='pending'), code de secours à haute entropie +
 * rate-limit dédié (5 tentatives / durée de vie du code).
 */
const router     = require('express').Router();
const crypto      = require('crypto');
const rateLimit   = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');

const HANDSHAKE_TTL_MS    = 2  * 60 * 1000;  // 2 minutes
const MANUAL_CODE_TTL_MS  = 10 * 60 * 1000;  // 10 minutes
const CREDENTIAL_TTL_MS   = 30 * 24 * 60 * 60 * 1000; // 30 jours (défaut d'un nouveau credential — identique à /api/auth/google)
const MANUAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I (ambiguïté visuelle)

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function randomStateToken() {
  return crypto.randomBytes(32).toString('hex'); // 256 bits
}

function generateManualCode() {
  const bytes = crypto.randomBytes(10);
  let raw = '';
  for (let i = 0; i < 10; i++) raw += MANUAL_CODE_ALPHABET[bytes[i] % MANUAL_CODE_ALPHABET.length];
  return `${raw.slice(0, 5)}-${raw.slice(5)}`; // ex: A7K9X-2PMQR
}

function normalizeManualCode(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* Générateurs — mêmes formats que routes/auth.js:/google (cf. generateActivationId/Secret) */
function generateActivationId() {
  return 'VID' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(5).toString('hex').toUpperCase();
}
function generateActivationSecret() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

/**
 * FIND-OR-CREATE — jamais delete+insert.
 * Réutilise le credential activation_codes existant de l'utilisateur s'il y
 * en a un (même logique que /api/auth/google et /api/user/me sur ce même
 * projet : un seul code stable par utilisateur). N'en crée un nouveau QUE
 * s'il n'en existe encore aucun. Ne touche jamais activation_devices ni
 * activation_channels.
 */
async function findOrCreateActivationCredential(supabase, userId) {
  const { data: existing, error: findErr } = await supabase
    .from('activation_codes')
    .select('activation_id, activation_secret, subscription_expiry')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findErr) throw new Error('Could not look up existing credential: ' + findErr.message);

  let credential = existing;

  if (!credential) {
    const activationId     = generateActivationId();
    const activationSecret = generateActivationSecret();
    const subscriptionExpiry = new Date(Date.now() + CREDENTIAL_TTL_MS).toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('activation_codes')
      .insert({
        user_id: userId,
        activation_id: activationId,
        activation_secret: activationSecret,
        subscription_expiry: subscriptionExpiry
      })
      .select('activation_id, activation_secret, subscription_expiry')
      .single();

    if (insertErr) throw new Error('Could not create credential: ' + insertErr.message);
    credential = inserted;
  }

  const { data: dbUser, error: userErr } = await supabase
    .from('users')
    .select('id, email, name, plan, status')
    .eq('id', userId)
    .single();
  if (userErr || !dbUser) throw new Error('User not found for pairing');
  if (dbUser.status === 'suspended') {
    const err = new Error('Account suspended');
    err.code = 'ACCOUNT_SUSPENDED';
    throw err;
  }

  return {
    activation_id: credential.activation_id,
    activation_secret: credential.activation_secret,
    subscription_expiry: credential.subscription_expiry,
    user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, plan: dbUser.plan }
  };
}

/* ── Rate limiters dédiés ──────────────────────────────────────────────
   Le state (256 bits) et le nonce ne sont pas devinables par force brute ;
   ces limiteurs protègent surtout /pair/redeem (code court, haute fréquence
   d'essais possible) et évitent l'épuisement de ressources sur les autres. */
const handshakeStartLimit    = rateLimit({ windowMs: 60 * 1000, max: 20,  message: { error: 'Too many requests' } });
const handshakeCompleteLimit = rateLimit({ windowMs: 60 * 1000, max: 30,  message: { error: 'Too many requests' } });
const manualCodeIssueLimit   = rateLimit({ windowMs: 60 * 1000, max: 10,  message: { error: 'Too many requests' } });
/* Verrou après 5 tentatives par IP sur la durée de vie du code (10 min) — le
   hash-lookup empêche un compteur par ligne (une supposition fausse ne
   correspond à aucune ligne existante), donc c'est ce rate-limit qui porte
   réellement la protection anti brute-force, avec l'entropie du code et son
   expiration courte. */
const manualCodeRedeemLimit  = rateLimit({ windowMs: MANUAL_CODE_TTL_MS, max: 5, message: { error: 'Too many attempts, please request a new code' } });

/* ══════════════════════════════════════════════════════════════
   FLUX A — Handshake automatique
══════════════════════════════════════════════════════════════ */

/* Appelé par le SITE (utilisateur déjà authentifié). Ne reçoit que le hash du
   nonce (challenge) — le nonce brut ne quitte jamais l'extension avant l'étape
   /handshake/complete. */
router.post('/handshake/start', requireAuth, handshakeStartLimit, async (req, res) => {
  try {
    const { challenge } = req.body;
    if (!challenge || typeof challenge !== 'string' || !/^[a-f0-9]{64}$/i.test(challenge)) {
      return res.status(400).json({ error: 'Invalid challenge' });
    }

    const supabase = req.app.locals.supabase;
    const state = randomStateToken();
    const expiresAt = new Date(Date.now() + HANDSHAKE_TTL_MS);

    const { error } = await supabase.from('pairing_requests').insert({
      user_id: req.user.id,
      nonce_hash: challenge.toLowerCase(),
      state,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    });
    if (error) return res.status(500).json({ error: 'Could not start handshake' });

    res.json({ state, expires_in: Math.floor(HANDSHAKE_TTL_MS / 1000) });
  } catch (err) {
    console.error('[extension/handshake/start]', err.message);
    res.status(500).json({ error: 'Handshake start failed' });
  }
});

/* Appelé DIRECTEMENT par l'extension (jamais relayé par le site) — c'est ici
   que le nonce brut apparaît pour la première et unique fois côté réseau. */
router.post('/handshake/complete', handshakeCompleteLimit, async (req, res) => {
  try {
    const { nonce, state } = req.body;
    if (!nonce || !state || typeof nonce !== 'string' || typeof state !== 'string') {
      return res.status(400).json({ error: 'nonce and state required' });
    }

    const supabase = req.app.locals.supabase;
    const { data: pending, error: findErr } = await supabase
      .from('pairing_requests')
      .select('id, user_id, nonce_hash, status, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (findErr || !pending) return res.status(401).json({ error: 'Invalid or unknown handshake' });
    if (pending.status !== 'pending') return res.status(409).json({ error: 'Handshake already used' });
    if (new Date(pending.expires_at) < new Date()) return res.status(410).json({ error: 'Handshake expired' });
    if (sha256Hex(nonce) !== pending.nonce_hash) return res.status(401).json({ error: 'Invalid handshake' });

    /* Consommation atomique anti-replay/anti-course : seule la requête qui
       trouve encore status='pending' au moment de l'UPDATE gagne. */
    const { data: consumed, error: consumeErr } = await supabase
      .from('pairing_requests')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select('user_id')
      .maybeSingle();

    if (consumeErr || !consumed) return res.status(409).json({ error: 'Handshake already used' });

    const credential = await findOrCreateActivationCredential(supabase, consumed.user_id);
    res.json(credential);
  } catch (err) {
    console.error('[extension/handshake/complete]', err.message);
    const status = err.code === 'ACCOUNT_SUSPENDED' ? 403 : 500;
    res.status(status).json({ error: err.code === 'ACCOUNT_SUSPENDED' ? 'Account suspended' : 'Handshake failed' });
  }
});

/* ══════════════════════════════════════════════════════════════
   FLUX B — Code de secours (un seul champ)
══════════════════════════════════════════════════════════════ */

router.post('/pair/manual-code', requireAuth, manualCodeIssueLimit, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const code = generateManualCode();
    const expiresAt = new Date(Date.now() + MANUAL_CODE_TTL_MS);

    /* Un seul code de secours en attente à la fois par utilisateur. */
    await supabase.from('pairing_manual_codes').delete().eq('user_id', req.user.id).eq('status', 'pending');

    const { error } = await supabase.from('pairing_manual_codes').insert({
      user_id: req.user.id,
      code_hash: sha256Hex(normalizeManualCode(code)),
      status: 'pending',
      expires_at: expiresAt.toISOString()
    });
    if (error) return res.status(500).json({ error: 'Could not generate code' });

    res.json({ code, expires_in: Math.floor(MANUAL_CODE_TTL_MS / 1000) });
  } catch (err) {
    console.error('[extension/pair/manual-code]', err.message);
    res.status(500).json({ error: 'Could not generate code' });
  }
});

router.post('/pair/redeem', manualCodeRedeemLimit, async (req, res) => {
  try {
    const normalized = normalizeManualCode(req.body?.code);
    if (!normalized) return res.status(400).json({ error: 'Code required' });

    const supabase = req.app.locals.supabase;
    const codeHash = sha256Hex(normalized);

    const { data: pending, error: findErr } = await supabase
      .from('pairing_manual_codes')
      .select('id, user_id, status, expires_at')
      .eq('code_hash', codeHash)
      .maybeSingle();

    if (findErr || !pending) return res.status(401).json({ error: 'Invalid code' });
    if (pending.status !== 'pending') return res.status(409).json({ error: 'Code already used' });
    if (new Date(pending.expires_at) < new Date()) return res.status(410).json({ error: 'Code expired' });

    const { data: consumed, error: consumeErr } = await supabase
      .from('pairing_manual_codes')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select('user_id')
      .maybeSingle();

    if (consumeErr || !consumed) return res.status(409).json({ error: 'Code already used' });

    const credential = await findOrCreateActivationCredential(supabase, consumed.user_id);
    res.json(credential);
  } catch (err) {
    console.error('[extension/pair/redeem]', err.message);
    const status = err.code === 'ACCOUNT_SUSPENDED' ? 403 : 500;
    res.status(status).json({ error: err.code === 'ACCOUNT_SUSPENDED' ? 'Account suspended' : 'Redeem failed' });
  }
});

module.exports = router;
