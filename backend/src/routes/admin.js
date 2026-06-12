/**
 * Routes Administration
 * GET    /api/admin/stats
 * GET    /api/admin/users
 * GET    /api/admin/users/:id
 * PUT    /api/admin/users/:id/plan
 * PUT    /api/admin/users/:id/status
 * DELETE /api/admin/users/:id
 * GET    /api/admin/revenue
 * GET    /api/admin/logs
 */
const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { getLimits }    = require('../config/plans');

/* Toutes les routes admin requièrent le rôle admin */
router.use(requireAdmin);

/* ── Statistiques globales ── */
router.get('/stats', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const d30 = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const d7  = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const cnt = (q) => q.select('id', { count: 'exact', head: true });

    const [total, free, pro, biz, diam, new30, active7, analysisRes, revenueRes] = await Promise.all([
      cnt(supabase.from('users')),
      cnt(supabase.from('users')).eq('plan', 'free'),
      cnt(supabase.from('users')).eq('plan', 'pro'),
      cnt(supabase.from('users')).eq('plan', 'business'),
      cnt(supabase.from('users')).eq('plan', 'diamant'),
      cnt(supabase.from('users')).gte('created_at', d30),
      cnt(supabase.from('users')).gte('last_login', d7),
      cnt(supabase.from('analysis_history')),
      supabase.from('payments').select('amount, created_at').eq('status', 'succeeded').gte('created_at', d30)
    ]);

    const mrr = (revenueRes.data || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalU = total.count || 0, paid = (pro.count || 0) + (biz.count || 0) + (diam.count || 0);

    res.json({
      users: {
        total:    totalU,
        free:     free.count || 0,
        pro:      pro.count  || 0,
        business: biz.count  || 0,
        diamant:  diam.count || 0,
        new_30d:  new30.count || 0,
        active_7d:active7.count || 0,
        conversion_rate: totalU ? Math.round((paid / totalU) * 1000) / 10 : 0
      },
      analyses: { total: analysisRes.count || 0 },
      revenue: {
        mrr: mrr.toFixed(2),
        arr: (mrr * 12).toFixed(2),
        transactions_30d: (revenueRes.data || []).length
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats fetch failed' });
  }
});

/* ── Liste des utilisateurs ── */
router.get('/users', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const page    = parseInt(req.query.page)   || 1;
    const limit   = parseInt(req.query.limit)  || 50;
    const search  = req.query.search || '';
    const plan    = req.query.plan   || '';
    const status  = req.query.status || '';
    const offset  = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id,email,name,plan,status,role,quota_used,quota_limit,language,country,created_at,last_login', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    if (plan)   query = query.eq('plan', plan);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    /* Enrichir avec fin de forfait + mode (mensuel/annuel) */
    const ids = (data || []).map(u => u.id);
    let subsByUser = {}, expByUser = {};
    if (ids.length) {
      const [{ data: subs }, { data: codes }] = await Promise.all([
        supabase.from('subscriptions')
          .select('user_id, interval, current_period_end, status, created_at')
          .in('user_id', ids).eq('status', 'active'),
        supabase.from('activation_codes')
          .select('user_id, subscription_expiry').in('user_id', ids)
      ]);
      (subs || []).forEach(s => {
        const cur = subsByUser[s.user_id];
        if (!cur || new Date(s.created_at) > new Date(cur.created_at)) subsByUser[s.user_id] = s;
      });
      (codes || []).forEach(c => { if (c.subscription_expiry) expByUser[c.user_id] = c.subscription_expiry; });
    }
    const users = (data || []).map(u => {
      const s = subsByUser[u.id];
      return {
        ...u,
        subscription_end:      s?.current_period_end || expByUser[u.id] || null,
        subscription_interval: s?.interval || null
      };
    });

    res.json({
      users,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Users fetch failed' });
  }
});

/* ── Détail utilisateur ── */
router.get('/users/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const [userRes, subRes, histRes, codesRes, devRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', req.params.id).single(),
      supabase.from('subscriptions').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false }),
      supabase.from('analysis_history').select('id,title,score_seo,score_global,created_at').eq('user_id', req.params.id).limit(10).order('created_at', { ascending: false }),
      supabase.from('activation_codes').select('activation_id, activation_secret, subscription_expiry').eq('user_id', req.params.id),
      supabase.from('activation_devices').select('device_id, bound_at').eq('user_id', req.params.id)
    ]);

    if (userRes.error) return res.status(404).json({ error: 'User not found' });

    res.json({
      user:          userRes.data,
      subscriptions: subRes.data  || [],
      recent_analyses: histRes.data || [],
      codes:         codesRes.data || [],
      devices:       devRes.data || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

/* ── Changer le plan ── */
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free','pro','business','diamant'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const supabase = req.app.locals.supabase;

    /* Mettre à jour le plan + quota_limit via plans.js (source de vérité) */
    await supabase.from('users')
      .update({
        plan,
        quota_limit: getLimits(plan).daily_analyses  // Free=10, Pro=200, Business=1000
      })
      .eq('id', req.params.id);

    /* Logger l'action admin */
    await supabase.from('admin_logs').insert({
      admin_id:       req.user.id,
      action:         `change_plan_to_${plan}`,
      target_user_id: req.params.id,
      details:        { new_plan: plan, changed_by: req.user.email }
    });

    /* Si manual pro: créer une subscription */
    if (plan !== 'free') {
      await supabase.from('subscriptions').upsert({
        user_id:  req.params.id,
        plan,
        provider: 'manual',
        status:   'active',
        current_period_start: new Date().toISOString(),
        current_period_end:   new Date(Date.now() + 30*24*60*60*1000).toISOString()
      }, { onConflict: 'user_id,provider' });
    }

    res.json({ message: `User plan updated to ${plan}` });
  } catch (err) {
    res.status(500).json({ error: 'Plan update failed' });
  }
});

/* ── Suspendre / Réactiver ── */
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active','suspended','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const supabase = req.app.locals.supabase;
    await supabase.from('users').update({ status }).eq('id', req.params.id);
    await supabase.from('admin_logs').insert({
      admin_id:       req.user.id,
      action:         `set_status_${status}`,
      target_user_id: req.params.id
    });

    res.json({ message: `User status set to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Status update failed' });
  }
});

/* ── Libérer les appareils d'un utilisateur (anti-revente) ── */
router.post('/users/:id/release-devices', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    await supabase.from('activation_devices').delete().eq('user_id', req.params.id);
    await supabase.from('admin_logs').insert({ admin_id: req.user.id, action: 'release_devices', target_user_id: req.params.id });
    res.json({ message: 'Devices released' });
  } catch (err) {
    res.status(500).json({ error: 'Release failed' });
  }
});

/* ── Modifier la date de fin de forfait ── */
router.put('/users/:id/expiry', async (req, res) => {
  try {
    const { date } = req.body;
    const iso = new Date(date).toISOString();
    if (isNaN(new Date(date))) return res.status(400).json({ error: 'Date invalide' });
    const supabase = req.app.locals.supabase;
    await supabase.from('activation_codes').update({ subscription_expiry: iso }).eq('user_id', req.params.id);
    await supabase.from('subscriptions').update({ current_period_end: iso }).eq('user_id', req.params.id).eq('status', 'active');
    await supabase.from('admin_logs').insert({ admin_id: req.user.id, action: 'set_expiry', target_user_id: req.params.id, details: { expiry: iso } });
    res.json({ message: 'Expiry updated', expiry: iso });
  } catch (err) {
    res.status(500).json({ error: 'Expiry update failed' });
  }
});

/* ── Liste des paiements ── */
router.get('/payments', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data } = await supabase
      .from('payments')
      .select('id, user_id, provider, amount, currency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    // joindre les emails
    const ids = [...new Set((data || []).map(p => p.user_id).filter(Boolean))];
    let emails = {};
    if (ids.length) {
      const { data: us } = await supabase.from('users').select('id, email').in('id', ids);
      (us || []).forEach(u => emails[u.id] = u.email);
    }
    res.json({ payments: (data || []).map(p => ({ ...p, email: emails[p.user_id] || '—' })) });
  } catch (err) {
    res.status(500).json({ error: 'Payments fetch failed' });
  }
});

/* ── Supprimer un utilisateur ── */
router.delete('/users/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    /* Récupérer auth_id */
    const { data: user } = await supabase
      .from('users').select('auth_id,email').eq('id', req.params.id).single();

    if (!user) return res.status(404).json({ error: 'User not found' });

    /* Supprimer auth user (cascade) */
    await supabase.auth.admin.deleteUser(user.auth_id);

    await supabase.from('admin_logs').insert({
      admin_id:       req.user.id,
      action:         'delete_user',
      target_user_id: req.params.id,
      details:        { deleted_email: user.email }
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

/* ── Revenus ── */
router.get('/revenue', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data } = await supabase.from('monthly_revenue').select('*');
    res.json({ monthly_revenue: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Revenue fetch failed' });
  }
});

/* ── Logs admin ── */
router.get('/logs', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data } = await supabase
      .from('admin_logs')
      .select('*, admin:admin_id(email), target:target_user_id(email)')
      .order('created_at', { ascending: false })
      .limit(100);
    res.json({ logs: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Logs fetch failed' });
  }
});

/* ── Config du site (clé/valeur) : emplacements pub, etc. ── */
router.get('/config/:key', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data } = await supabase.from('site_config').select('value').eq('key', req.params.key).single();
  res.json({ key: req.params.key, value: data?.value || '' });
});
router.put('/config/:key', async (req, res) => {
  const supabase = req.app.locals.supabase;
  await supabase.from('site_config').upsert(
    { key: req.params.key, value: req.body.value || '', updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  res.json({ message: 'saved' });
});

module.exports = router;


/* ══════════════════════════════════════════════════════════════
   CODES PROMO & LICENCES MANUELLES
══════════════════════════════════════════════════════════════ */

/* ── Créer un code promo ── */
router.post('/promo', async (req, res) => {
  try {
    const { code, type, plan, discount_pct, trial_days, max_uses, expires_at } = req.body;
    if (!code || !type) return res.status(400).json({ error: 'code and type required' });

    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase.from('promo_codes').insert({
      code: code.toUpperCase().trim(),
      type, plan, discount_pct: discount_pct || 0,
      trial_days: trial_days || 0,
      max_uses: max_uses || 1,
      expires_at: expires_at || null,
      created_by: req.user.id
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });

    await supabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'create_promo_code',
      details: { code, type, plan }
    });

    res.status(201).json({ promo: data });
  } catch (err) {
    res.status(500).json({ error: 'Promo creation failed' });
  }
});

/* ── Liste des codes promo ── */
router.get('/promos', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data } = await supabase.from('promo_codes')
    .select('*, created_by:users(email)')
    .order('created_at', { ascending: false });
  res.json({ promos: data || [] });
});

/* ── Désactiver un code promo ── */
router.put('/promo/:id/toggle', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: promo } = await supabase.from('promo_codes').select('is_active').eq('id', req.params.id).single();
  await supabase.from('promo_codes').update({ is_active: !promo?.is_active }).eq('id', req.params.id);
  res.json({ message: 'Toggled' });
});

/* ── Accorder une licence manuelle ── */
router.post('/license', async (req, res) => {
  try {
    const { user_id, plan, reason, expires_at } = req.body;
    if (!user_id || !plan) return res.status(400).json({ error: 'user_id and plan required' });
    if (!['pro','business','lifetime'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    const supabase = req.app.locals.supabase;

    /* Mettre à jour le plan utilisateur */
    const dbPlan = plan === 'lifetime' ? 'pro' : plan;
    await supabase.from('users').update({
      plan:        dbPlan,
      is_lifetime: plan === 'lifetime',
      quota_limit: getLimits(dbPlan).daily_analyses  // Pro=200, Business=1000
    }).eq('id', user_id);

    /* Créer la licence */
    const { data: license } = await supabase.from('manual_licenses').insert({
      user_id, plan, reason,
      expires_at: plan === 'lifetime' ? null : expires_at,
      granted_by: req.user.id,
      is_active: true
    }).select().single();

    await supabase.from('admin_logs').insert({
      admin_id: req.user.id, action: `grant_${plan}_license`,
      target_user_id: user_id, details: { reason, expires_at }
    });

    res.status(201).json({ license, message: `${plan} license granted` });
  } catch (err) {
    res.status(500).json({ error: 'License grant failed' });
  }
});

/* ── Liste des licences ── */
router.get('/licenses', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data } = await supabase.from('manual_licenses')
    .select('*, user:user_id(email,name), granted_by:users(email)')
    .order('created_at', { ascending: false });
  res.json({ licenses: data || [] });
});

/* ── Invitations bêta ── */
router.post('/beta/invite', async (req, res) => {
  try {
    const { emails, plan = 'pro' } = req.body;
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });

    const supabase = req.app.locals.supabase;
    const invites = emails.map(email => ({
      email: email.toLowerCase().trim(),
      plan,
      invited_by: req.user.id,
      expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString()
    }));

    const { data, error } = await supabase.from('beta_invitations')
      .upsert(invites, { onConflict: 'email' }).select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ invited: data?.length, invitations: data });
  } catch (err) {
    res.status(500).json({ error: 'Invite failed' });
  }
});

router.get('/beta/invitations', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data } = await supabase.from('beta_invitations')
    .select('*')
    .order('created_at', { ascending: false });
  res.json({ invitations: data || [] });
});
