/**
 * Routes d'activation de l'extension Chrome
 * POST /api/activation/activate          → valider ID + Secret (renvoie la chaîne verrouillée)
 * POST /api/activation/bind-channel      → verrouiller UNE chaîne sur ce code (1 ID = 1 chaîne)
 * GET  /api/activation/remaining/:id     → vérifier la durée restante
 *
 * Les codes sont stockés dans la table `activation_codes`
 * (générés par POST /api/auth/google lors de la connexion au dashboard).
 * La chaîne verrouillée est stockée dans activation_codes.channel_id / channel_name.
 */
const router = require('express').Router();
const { getChannelLimit } = require('../config/channelLimits');

/* Récupère un code d'activation valide (ID + Secret) ou null */
async function findValidCode(supabase, activation_id, activation_secret) {
  const { data: code } = await supabase
    .from('activation_codes')
    .select('*')                 // select('*') : résilient si la colonne channel_id n'existe pas encore
    .eq('activation_id', activation_id)
    .eq('activation_secret', activation_secret)
    .maybeSingle();
  return code || null;
}

/* ── Valider ID + Secret (appelé par l'extension) ── */
router.post('/activate', async (req, res) => {
  try {
    const { activation_id, activation_secret } = req.body;
    if (!activation_id || !activation_secret) {
      return res.status(400).json({ error: 'ID et Secret requis' });
    }

    const supabase = req.app.locals.supabase;
    const code = await findValidCode(supabase, activation_id, activation_secret);
    if (!code) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    if (expiryDate < now) {
      return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, plan')
      .eq('id', code.user_id)
      .maybeSingle();

    // Liste des chaînes autorisées (multi-chaînes selon le plan)
    const { data: chans } = await supabase
      .from('activation_channels')
      .select('channel_id, channel_name')
      .eq('user_id', code.user_id);
    const channels = chans || [];

    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      user: {
        id:    user?.id,
        email: user?.email,
        name:  user?.name,
        plan:  user?.plan || 'free'
      },
      subscription: {
        expiry:         code.subscription_expiry,
        days_remaining: Math.max(0, daysRemaining),
        is_active:      true
      },
      // Chaînes autorisées + limite du plan
      channels,
      channel_ids:   channels.map(c => c.channel_id),
      channel_limit: getChannelLimit(user?.plan)
    });
  } catch (err) {
    console.error('[ACTIVATION]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'activation' });
  }
});

/* ── Verrouiller UNE chaîne sur ce code (1 ID = 1 chaîne) ── */
router.post('/bind-channel', async (req, res) => {
  try {
    const { activation_id, activation_secret, channel_id, channel_name } = req.body;
    if (!activation_id || !activation_secret || !channel_id) {
      return res.status(400).json({ error: 'ID, Secret et channel_id requis' });
    }

    const supabase = req.app.locals.supabase;
    const code = await findValidCode(supabase, activation_id, activation_secret);
    if (!code) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    // (Re)lier la chaîne — 1 ID = 1 chaîne ACTIVE à la fois, mais corrigible
    // (la nouvelle chaîne remplace l'ancienne ; évite un verrou définitif sur une mauvaise chaîne).
    const { error: upErr } = await supabase
      .from('activation_codes')
      .update({ channel_id, channel_name: channel_name || channel_id })
      .eq('activation_id', activation_id);

    if (upErr) {
      console.error('[BIND-CHANNEL] update error:', upErr.message);
      return res.status(500).json({ error: 'Impossible de verrouiller la chaîne' });
    }

    res.json({ success: true, locked: true, channel_id, channel_name: channel_name || channel_id });
  } catch (err) {
    console.error('[BIND-CHANNEL]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ── Vérifier la durée restante (appelé par l'extension) ── */
router.get('/remaining/:activation_id', async (req, res) => {
  try {
    const { activation_id } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: code, error } = await supabase
      .from('activation_codes')
      .select('subscription_expiry')
      .eq('activation_id', activation_id)
      .maybeSingle();

    if (error || !code) {
      return res.status(404).json({ error: 'ID non trouvé' });
    }

    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      expiry:         code.subscription_expiry,
      days_remaining: Math.max(0, daysRemaining),
      is_active:      expiryDate > now
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ════════════════════════════════════════════════════════════════
   IA via code d'activation (l'extension n'a pas de JWT)
   Gating par plan : Titres IA / Rapport IA / Concurrence = Pro & Business.
   ════════════════════════════════════════════════════════════════ */
const { generateTitles, generateReport, generateCompetitorInsights } = require('../utils/aiClient');

/* Valide le code + récupère le plan de l'utilisateur. Renvoie {code,user} ou null. */
async function getCodeUser(supabase, activation_id, activation_secret) {
  const code = await findValidCode(supabase, activation_id, activation_secret);
  if (!code) return null;
  if (new Date(code.subscription_expiry) < new Date()) return { expired: true };
  const { data: user } = await supabase
    .from('users').select('id, plan').eq('id', code.user_id).maybeSingle();
  return { code, user, plan: (user?.plan || 'free') };
}

/* Middleware-like : exige un plan payant (pro/business) */
function requirePaidPlan(plan) {
  return ['pro', 'business'].includes((plan || '').toLowerCase());
}

/* ── Titres IA (Pro/Business) ── */
router.post('/ai/titles', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)         return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired)  return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    const result = await generateTitles(title, language);

    // FREE = aperçu : 1 vrai titre visible, le reste verrouillé (hook de conversion)
    if (!requirePaidPlan(ctx.plan)) {
      const all = result.titles || [];
      return res.json({ titles: all.slice(0, 1), preview: true, locked: Math.max(0, all.length - 1) });
    }

    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/TITLES]', err.message);
    res.status(500).json({ error: 'Génération des titres échouée', details: err.message });
  }
});

/* ── Rapport IA complet (Pro/Business) ── */
router.post('/ai/report', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, description = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    const result = await generateReport(title, description, language);

    // FREE = aperçu : score + 1 insight IA visibles, checklist/suggestions verrouillées
    if (!requirePaidPlan(ctx.plan)) {
      return res.json({
        score: result.score,
        viral_score: result.viral_score,
        viral_reason: result.viral_reason,
        checklist: [],
        suggestions: [],
        preview: true
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/REPORT]', err.message);
    res.status(500).json({ error: 'Génération du rapport échouée' });
  }
});

/* ── Analyse concurrentielle IA (Pro/Business) ── */
router.post('/ai/competitor', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Analyse concurrents réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await generateCompetitorInsights(title, language);
    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/COMPETITOR]', err.message);
    res.status(500).json({ error: 'Analyse concurrentielle échouée' });
  }
});

/* ── Vraies données YouTube (API v3) — Pro/Business ── */
const { getVideoStats, searchVideos, getChannelAudit, getKeywordIdeas } = require('../utils/youtube');
const { analyzeThumbnail } = require('../utils/aiClient');

router.post('/youtube/video', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Données YouTube réelles réservées aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    const data = await getVideoStats(videoId);
    if (!data) return res.status(404).json({ error: 'Vidéo introuvable' });
    res.json(data);
  } catch (err) {
    console.error('[YT/VIDEO]', err.message);
    res.status(500).json({ error: 'Données YouTube indisponibles', details: err.message });
  }
});

router.post('/youtube/competitors', async (req, res) => {
  try {
    const { activation_id, activation_secret, query } = req.body;
    if (!activation_id || !activation_secret || !query) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Analyse concurrents réelle réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    const videos = await searchVideos(query, 8);
    res.json({ videos });
  } catch (err) {
    console.error('[YT/COMP]', err.message);
    res.status(500).json({ error: 'Recherche indisponible', details: err.message });
  }
});

/* ── Audit de chaîne (Pro/Business) ── */
router.post('/youtube/channel-audit', async (req, res) => {
  try {
    const { activation_id, activation_secret, channelId } = req.body;
    if (!activation_id || !activation_secret || !channelId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Audit de chaîne réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    const audit = await getChannelAudit(channelId);
    if (!audit) return res.status(404).json({ error: 'Chaîne introuvable' });
    res.json(audit);
  } catch (err) {
    console.error('[YT/AUDIT]', err.message);
    res.status(500).json({ error: 'Audit indisponible', details: err.message });
  }
});

/* ── Recherche de mots-clés (Pro/Business) ── */
router.post('/youtube/keywords', async (req, res) => {
  try {
    const { activation_id, activation_secret, query } = req.body;
    if (!activation_id || !activation_secret || !query) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Recherche de mots-clés réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    const ideas = await getKeywordIdeas(query);
    res.json(ideas);
  } catch (err) {
    console.error('[YT/KW]', err.message);
    res.status(500).json({ error: 'Recherche indisponible', details: err.message });
  }
});

/* ── Analyse de miniature par IA (Pro/Business) ── */
router.post('/ai/thumbnail', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, title = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Analyse de miniature réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    // Récupérer l'image de la miniature et la convertir en base64
    let b64 = null;
    for (const q of ['maxresdefault', 'hqdefault', 'mqdefault']) {
      try {
        const ir = await fetch(`https://i.ytimg.com/vi/${videoId}/${q}.jpg`);
        if (ir.ok) { const buf = Buffer.from(await ir.arrayBuffer()); if (buf.length > 1000) { b64 = buf.toString('base64'); break; } }
      } catch (e) {}
    }
    if (!b64) return res.status(404).json({ error: 'Miniature introuvable' });

    const result = await analyzeThumbnail(b64, title, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/THUMB]', err.message);
    res.status(500).json({ error: 'Analyse de miniature indisponible', details: err.message });
  }
});

module.exports = router;
