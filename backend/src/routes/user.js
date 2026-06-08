/**
 * Routes utilisateur
 * GET  /api/user/me
 * PUT  /api/user/me
 * GET  /api/user/plan        ← vérification plan (utilisée par l'extension)
 * GET  /api/user/quota
 * GET  /api/user/history
 * DELETE /api/user/history/:id
 * DELETE /api/user/account
 */
const router = require('express').Router();
const { requireAuth }  = require('../middleware/auth');
const { getLimits }    = require('../config/plans');

/* ── Mon profil ── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id, email, name, avatar, plan, status, role,
            quota_used, quota_limit, language, created_at } = req.user;

    // Récupérer l'ID d'activation et le Secret depuis la table activation_codes
    const { data: userData, error } = await supabase
      .from('activation_codes')
      .select('activation_id, activation_secret, subscription_expiry')
      .eq('user_id', id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /user/me] Error fetching activation codes:', error);
    }

    res.json({
      id, email, name, avatar, plan, status, role,
      quota_used, quota_limit, language, created_at,
      activation_id: userData?.activation_id,
      activation_secret: userData?.activation_secret,
      subscription_expiry: userData?.subscription_expiry
    });
  } catch (err) {
    console.error('[GET /me]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

/* ── Mettre à jour le profil ── */
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, language, avatar } = req.body;
    const updates = {};
    if (name)     updates.name = name;
    if (language) updates.language = language;
    if (avatar)   updates.avatar = avatar;

    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, name, language, avatar')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Profile updated', user: data });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/* ── Vérification plan (utilisée par l'extension à chaque ouverture) ── */
router.get('/plan', requireAuth, async (req, res) => {
  const supabase = req.app.locals.supabase;

  /* Vérifier si l'abonnement Pro est encore actif */
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let plan = req.user.plan;

  /* Si l'abonnement est expiré, rétrograder vers free */
  if (sub && sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
    plan = 'free';
    await supabase.from('users').update({ plan: 'free' }).eq('id', req.user.id);
  }

  res.json({
    plan,
    quota_used:  req.user.quota_used,
    quota_limit: req.user.quota_limit,
    features: getFeaturesForPlan(plan)
  });
});

/* ── Quota ── */
router.get('/quota', requireAuth, (req, res) => {
  const limits = getLimits(req.user.plan);
  res.json({
    plan:              req.user.plan,
    analyses_used:     req.user.quota_used,
    analyses_limit:    limits.daily_analyses,
    analyses_remaining:Math.max(0, limits.daily_analyses - req.user.quota_used),
    titles_used:       req.user.titles_used || 0,
    titles_limit:      limits.daily_titles,
    titles_remaining:  Math.max(0, limits.daily_titles - (req.user.titles_used || 0)),
    reset_at:          'midnight UTC'
  });
});

/* ── Incrémenter quota ── */
router.post('/quota/increment', requireAuth, async (req, res) => {
  try {
    if (req.user.plan !== 'free') {
      return res.json({ message: 'No quota for Pro/Business' });
    }

    const supabase = req.app.locals.supabase;
    await supabase.rpc('increment_user_quota', { p_user_id: req.user.id });

    await supabase.from('quota_logs').insert({
      user_id:  req.user.id,
      action:   req.body.action || 'analysis',
      video_id: req.body.video_id
    });

    /* Relire la valeur réelle après l'incrément atomique */
    const { data: updated } = await supabase
      .from('users').select('quota_used').eq('id', req.user.id).single();
    res.json({ quota_used: updated?.quota_used ?? req.user.quota_used + 1, quota_limit: req.user.quota_limit });
  } catch (err) {
    res.status(500).json({ error: 'Quota update failed' });
  }
});

/* ── Historique des analyses ── */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('analysis_history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      data,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'History fetch failed' });
  }
});

/* ── Supprimer une analyse ── */
router.delete('/history/:id', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Analysis deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

/* ── Supprimer le compte ── */
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    /* Annuler l'abonnement Stripe si existant */
    if (req.user.subscription_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(req.user.subscription_id);
      } catch (e) { console.warn('Stripe cancel error:', e.message); }
    }

    /* Supprimer l'auth user (cascade supprime les données DB) */
    const { error } = await supabase.auth.admin.deleteUser(req.authUser.id);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

/* ── Helper: features par plan (utilise getLimits) ── */
function getFeaturesForPlan(plan) {
  const limits = getLimits(plan);
  const base   = {
    seo_score: true, viral_score: true, thumbnail_score: true,
    checklist: true, basic_suggestions: true,
    daily_analyses: limits.daily_analyses,
    daily_titles:   limits.daily_titles
  };
  if (plan === 'free') return base;
  if (plan === 'pro')  return {
    ...base,
    full_report: true, ai_titles: true, competitor_analysis: true,
    pdf_export: true,  history: true,   vision_ai: true
  };
  if (plan === 'business') return {
    ...base,
    full_report: true, ai_titles: true, competitor_analysis: true,
    pdf_export: true,  history: true,   vision_ai: true,
    multi_channel: true, team: true, api_access: true, advanced_reports: true
  };
  return base;
}

module.exports = router;
