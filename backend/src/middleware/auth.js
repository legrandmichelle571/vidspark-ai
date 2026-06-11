/**
 * Middleware d'authentification
 * Vérifie le JWT Supabase et récupère l'utilisateur
 */
const { createClient } = require('@supabase/supabase-js');
const { getLimits }    = require('../config/plans');

/* Client pour valider les JWT utilisateurs.
   On utilise la SERVICE_KEY (et non l'ANON_KEY) car la clé anon peut être
   manquante/placeholder en prod ; getUser(token) valide quand même le JWT passé. */
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

/* ── Middleware auth obligatoire ── */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];

    /* Vérifier le token via Supabase */
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    /* Récupérer l'utilisateur complet depuis la DB */
    const supabase = req.app.locals.supabase;
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    /* Vérifier que le compte n'est pas suspendu */
    if (dbUser.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    req.user     = dbUser;
    req.authUser = user;
    next();
  } catch (err) {
    console.error('[AUTH]', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/* ── Middleware admin obligatoire ── */
async function requireAdmin(req, res, next) {
  // Auth par clé admin (pour le tableau de bord de commande sur PC)
  const key = req.headers['x-admin-key'];
  if (key && process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY) {
    req.user = { id: null, email: 'console-admin', role: 'admin' };
    return next();
  }
  // Sinon : auth JWT classique + rôle admin
  await requireAuth(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/* ── Middleware plan Pro ou Business ── */
function requirePro(req, res, next) {
  if (!['pro', 'business'].includes(req.user?.plan)) {
    return res.status(403).json({
      error:       'Pro subscription required',
      code:        'UPGRADE_REQUIRED',
      upgrade_url: process.env.FRONTEND_URL + '/pricing'
    });
  }
  next();
}

/* ── Middleware vérification quota analyses journalier ────────────
   S'applique à TOUS les plans : Free, Pro et Business.
   Limite lue depuis PLAN_LIMITS (source de vérité unique).
   Compare quota_used (rechargé à minuit UTC) à daily_analyses.
──────────────────────────────────────────────────────────────── */
function checkQuota(req, res, next) {
  const user   = req.user;
  const limits = getLimits(user.plan);

  if (user.quota_used >= limits.daily_analyses) {
    return res.status(429).json({
      error:       'Daily analysis quota exceeded',
      code:        'QUOTA_EXCEEDED',
      quota_used:  user.quota_used,
      quota_limit: limits.daily_analyses,
      plan:        user.plan,
      reset_at:    'midnight UTC'
    });
  }
  next();
}

/* ── Middleware vérification quota titres IA journalier ──────────
   - Free → daily_titles = 0 → 403 UPGRADE_REQUIRED
   - Pro  → bloque à 100 titres/jour
   - Business → bloque à 500 titres/jour
   Lit titles_used depuis req.user (colonne users.titles_used).
──────────────────────────────────────────────────────────────── */
function checkTitlesQuota(req, res, next) {
  const user   = req.user;
  const limits = getLimits(user.plan);

  /* Free : accès titres IA bloqué */
  if (limits.daily_titles === 0) {
    return res.status(403).json({
      error:       'Pro subscription required',
      code:        'UPGRADE_REQUIRED',
      upgrade_url: process.env.FRONTEND_URL + '/pricing'
    });
  }

  /* Pro / Business : vérifier la limite journalière */
  const titlesUsed = user.titles_used || 0;
  if (titlesUsed >= limits.daily_titles) {
    return res.status(429).json({
      error:        'Daily titles quota exceeded',
      code:         'TITLES_QUOTA_EXCEEDED',
      titles_used:  titlesUsed,
      titles_limit: limits.daily_titles,
      plan:         user.plan,
      reset_at:     'midnight UTC'
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requirePro,
  checkQuota,
  checkTitlesQuota
};
