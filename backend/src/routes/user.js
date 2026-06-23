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
const { getChannelLimit } = require('../config/channelLimits');

/* ── Mes chaînes YouTube autorisées (gérées depuis le dashboard) ── */

/* Liste des chaînes + limite du plan */
router.get('/channels', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data: channels } = await supabase
      .from('activation_channels')
      .select('channel_id, channel_name, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    res.json({
      plan:     req.user.plan,
      limit:    getChannelLimit(req.user.plan),
      channels: channels || []
    });
  } catch (err) {
    console.error('[GET /user/channels]', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des chaînes' });
  }
});

/* Résoudre une URL / @handle / UC... en ID de chaîne UC... (fetch côté serveur) */
async function resolveChannelId(input) {
  if (!input) return null;
  const direct = input.match(/(UC[a-zA-Z0-9_-]{22})/);
  if (direct) return { id: direct[1], name: null };

  let url = input.trim();
  if (!/^https?:\/\//.test(url)) {
    url = 'https://www.youtube.com/' + url.replace(/^\//, '');
  }
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await resp.text();
    const idm = html.match(/"(?:channelId|externalId)":"(UC[a-zA-Z0-9_-]{22})"/)
             || html.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    const namem = html.match(/<meta property="og:title" content="([^"]+)"/)
               || html.match(/"title":"([^"]+)"/);
    if (idm) return { id: idm[1], name: namem ? namem[1] : null };
  } catch (e) {
    console.warn('[resolveChannelId] fetch error:', e.message);
  }
  return null;
}

/* Ajouter une chaîne (respecte la limite du plan) */
router.post('/channels', requireAuth, async (req, res) => {
  try {
    let { channel_id, channel_name, channel_url } = req.body;

    // Résoudre l'URL / @handle en ID UC... si besoin
    if (!channel_id || !/^UC[a-zA-Z0-9_-]{22}$/.test(channel_id)) {
      const resolved = await resolveChannelId(channel_url || channel_id);
      if (!resolved) {
        return res.status(400).json({ error: 'Chaîne introuvable. Colle l\'URL de ta chaîne YouTube (ex: youtube.com/@TaChaine).' });
      }
      channel_id = resolved.id;
      channel_name = channel_name || resolved.name || resolved.id;
    }

    const supabase = req.app.locals.supabase;
    const limit = getChannelLimit(req.user.plan);

    const { data: existing } = await supabase
      .from('activation_channels')
      .select('channel_id')
      .eq('user_id', req.user.id);

    const current = existing || [];
    // Déjà présente ?
    if (current.some(c => c.channel_id === channel_id)) {
      return res.status(200).json({ message: 'Chaîne déjà ajoutée', limit, count: current.length });
    }
    // Limite atteinte ?
    if (current.length >= limit) {
      return res.status(403).json({
        error: `Limite atteinte (${limit} chaîne${limit > 1 ? 's' : ''}). Passez à Business pour 5 chaînes.`,
        code:  'CHANNEL_LIMIT_REACHED',
        limit
      });
    }

    const { error: insErr } = await supabase
      .from('activation_channels')
      .insert({ user_id: req.user.id, channel_id, channel_name: channel_name || channel_id });

    if (insErr) {
      console.error('[POST /user/channels] insert error:', insErr.message);
      return res.status(500).json({ error: 'Impossible d\'ajouter la chaîne' });
    }

    res.status(201).json({ message: 'Chaîne ajoutée', channel_id, channel_name: channel_name || channel_id, limit, count: current.length + 1 });
  } catch (err) {
    console.error('[POST /user/channels]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la chaîne' });
  }
});

/* Retirer une chaîne */
router.delete('/channels/:channel_id', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('activation_channels')
      .delete()
      .eq('user_id', req.user.id)
      .eq('channel_id', req.params.channel_id);

    if (error) return res.status(500).json({ error: 'Impossible de retirer la chaîne' });
    res.json({ message: 'Chaîne retirée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la chaîne' });
  }
});

/* ── Mon profil ── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id, email, name, avatar, plan, status, role,
            quota_used, quota_limit, language, created_at } = req.user;

    // Récupérer TOUS les codes d'activation (Business = 5, autres = 1)
    const { data: codeRows, error } = await supabase
      .from('activation_codes')
      .select('activation_id, activation_secret, subscription_expiry')
      .eq('user_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET /user/me] Error fetching activation codes:', error);
    }

    let codes = codeRows || [];

    // Compléter les codes si besoin — 1 code/utilisateur (Business = 5 PC via activation_devices)
    const needed = 1;
    if (codes.length < needed) {
      const expiry = codes[0]?.subscription_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const genId = () => 'VID' + Math.random().toString(36).substring(2, 11).toUpperCase() + Date.now().toString(36).toUpperCase();
      const genSecret = () => Math.random().toString(36).substring(2, 18).toUpperCase() + Math.random().toString(36).substring(2, 18).toUpperCase();
      const toCreate = [];
      for (let i = codes.length; i < needed; i++) {
        toCreate.push({ user_id: id, activation_id: genId(), activation_secret: genSecret(), subscription_expiry: expiry });
      }
      const { data: created } = await supabase
        .from('activation_codes').insert(toCreate)
        .select('activation_id, activation_secret, subscription_expiry');
      codes = codes.concat(created || []);
    }

    res.json({
      id, email, name, avatar, plan, status, role,
      quota_used, quota_limit, language, created_at,
      activation_id: codes[0]?.activation_id,
      activation_secret: codes[0]?.activation_secret,
      subscription_expiry: codes[0]?.subscription_expiry,
      codes: codes.map(c => ({ activation_id: c.activation_id, activation_secret: c.activation_secret }))
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

/* ── Appareils liés au code d'activation ── */
router.get('/devices', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data } = await supabase
      .from('activation_devices')
      .select('device_id, bound_at')
      .eq('user_id', req.user.id);
    const max = getChannelLimit(req.user.plan);
    res.json({ devices: data || [], used: (data || []).length, max });
  } catch (err) {
    console.error('[DEVICES]', err.message);
    res.status(500).json({ error: 'Erreur lecture appareils' });
  }
});

/* Libérer tous les appareils du compte — depuis le dashboard, si un PC est perdu. */
router.post('/devices/release', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('activation_devices')
      .delete()
      .eq('user_id', req.user.id);
    if (error) throw new Error(error.message);
    res.json({ success: true, released: true });
  } catch (err) {
    console.error('[DEVICES/RELEASE]', err.message);
    res.status(500).json({ error: 'Erreur libération' });
  }
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

/* ── Coach IA : score de chaîne + plan d'action priorisé (data-driven) ── */
router.get('/coach', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data: rows } = await supabase
      .from('analysis_history')
      .select('video_id,title,score_seo,score_viral,score_global,created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(12);

    const n = (x) => { const v = Number(x); return Number.isFinite(v) ? Math.round(v) : 0; };
    const vids = (rows || []).map(r => {
      const seo = n(r.score_seo), viral = n(r.score_viral);
      const score = r.score_global != null ? n(r.score_global) : Math.round((seo + viral) / 2);
      return { video_id: r.video_id, title: r.title || '', seo, viral, score, created_at: r.created_at };
    });

    if (!vids.length) {
      return res.json({
        has_data: false, score: 0, potential: 0, points: 0, main_problem: 'new', videos: [],
        actions: [
          { key: 'analyze', icon: '🎬', gain: 22, priority: 'red',    goto: 'analyze' },
          { key: 'thumb',   icon: '🎨', gain: 14, priority: 'amber',  goto: 'thumbnail' },
          { key: 'ideas',   icon: '💡', gain: 8,  priority: 'yellow', goto: 'ideas' }
        ]
      });
    }

    const now = Date.now();
    let wsum = 0, swsum = 0, seoSum = 0, viralSum = 0;
    vids.forEach(v => {
      const weeks = Math.max(0, (now - new Date(v.created_at).getTime()) / (7 * 864e5));
      const w = 1 / (1 + weeks);
      wsum += w; swsum += v.score * w; seoSum += v.seo; viralSum += v.viral;
    });
    const score = Math.round(swsum / (wsum || 1));
    const avgSeo = Math.round(seoSum / vids.length);
    const avgViral = Math.round(viralSum / vids.length);
    let cadenceDays = null;
    if (vids.length >= 2) cadenceDays = Math.round((new Date(vids[0].created_at) - new Date(vids[1].created_at)) / 864e5);

    const A = [];
    if (avgSeo < 78)   A.push({ key: 'seo',     icon: '✍️', gain: Math.max(4, Math.round((90 - avgSeo) * 0.45)), goto: 'analyze' });
    if (score < 85)    A.push({ key: 'thumb',   icon: '🎨', gain: 12, goto: 'thumbnail' });
    if (avgViral < 78) A.push({ key: 'viral',   icon: '📱', gain: Math.max(4, Math.round((90 - avgViral) * 0.25)), goto: 'shorts' });
    if (cadenceDays != null && cadenceDays > 10) A.push({ key: 'cadence', icon: '📅', gain: 8, goto: 'ideas' });
    if (!A.length) A.push({ key: 'grow', icon: '🚀', gain: 6, goto: 'trending', opportunity: true });

    A.sort((a, b) => b.gain - a.gain);
    A.forEach(a => { a.priority = a.opportunity ? 'green' : a.gain >= 15 ? 'red' : a.gain >= 8 ? 'amber' : 'yellow'; });

    const points = A.reduce((s, a) => s + a.gain, 0);
    const potential = Math.min(95, score + points);
    const top = A[0] ? A[0].key : 'grow';
    const main_problem = top === 'seo' ? 'seo' : top === 'thumb' ? 'ctr' : top === 'cadence' ? 'cadence' : top === 'grow' ? 'healthy' : 'viral';

    res.json({
      has_data: true, score, potential, points,
      avg_seo: avgSeo, avg_viral: avgViral, cadence_days: cadenceDays,
      main_problem, videos: vids.slice(0, 5), actions: A.slice(0, 4)
    });
  } catch (err) {
    console.error('[USER/COACH]', err.message);
    res.status(500).json({ error: 'Coach unavailable' });
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
  if (plan === 'diamant') return {
    ...base,
    full_report: true, ai_titles: true, competitor_analysis: true,
    pdf_export: true,  history: true,   vision_ai: true,
    multi_channel: true, team: true, api_access: true, advanced_reports: true,
    channel_audit: true, rank_tracker: true   // 💎 exclusifs Diamant (site)
  };
  return base;
}

module.exports = router;
