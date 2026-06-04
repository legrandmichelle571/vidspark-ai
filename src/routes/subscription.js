/**
 * Routes abonnements
 * GET  /api/subscription/plans
 * POST /api/subscription/checkout/stripe
 * POST /api/subscription/checkout/paypal
 * POST /api/subscription/cancel
 * GET  /api/subscription/status
 * GET  /api/subscription/invoices
 */
const router  = require('express').Router();
const { requireAuth } = require('../middleware/auth');

/* ── Définition unique des plans — source de vérité ─────────────
   Chaque plan est défini ici une seule fois et utilisé dans
   la route GET /plans. Ne pas dupliquer ailleurs dans ce fichier.
──────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id:            'free',
    name:          'Free',
    price_monthly: 0,
    price_yearly:  0,
    features: [
      '10 analyses/jour',
      'Score SEO',
      'Score Viral',
      'Checklist SEO'
    ],
    limits: {
      daily_analyses: 10,
      daily_titles:   0
    }
  },
  {
    id:                   'pro',
    name:                 'Pro',
    price_monthly:        9.99,
    price_yearly:         107.89,
    stripe_price_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripe_price_yearly:  process.env.STRIPE_PRICE_PRO_YEARLY,
    features: [
      '200 analyses/jour',
      '100 titres IA/jour',
      'Rapport IA complet',
      'Titres IA',
      'Analyse concurrentielle',
      'Export PDF',
      'Historique'
    ],
    limits: {
      daily_analyses: 200,
      daily_titles:   100
    }
  },
  {
    id:                   'business',
    name:                 'Business',
    price_monthly:        29.99,
    price_yearly:         323.89,
    stripe_price_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    stripe_price_yearly:  process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    features: [
      '1 000 analyses/jour',
      '500 titres IA/jour',
      'Tout Pro +',
      'Multi-chaînes',
      'Gestion équipe',
      'API Access',
      'Support prioritaire'
    ],
    limits: {
      daily_analyses: 1000,
      daily_titles:   500
    }
  }
];

/* ── Plans disponibles ── */
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

/* ── Créer session Stripe Checkout ── */
router.post('/checkout/stripe', requireAuth, async (req, res) => {
  try {
    const { plan, interval = 'month' } = req.body;
    if (!['pro', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const supabase = req.app.locals.supabase;

    /* Créer ou récupérer le customer Stripe */
    let customerId = req.user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    req.user.email,
        name:     req.user.name,
        metadata: { vidspark_user_id: req.user.id }
      });
      customerId = customer.id;
      await supabase.from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    /* Prix Stripe selon plan et intervalle */
    const priceKey = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}LY`;
    const priceId  = process.env[priceKey];
    if (!priceId) {
      return res.status(400).json({ error: 'Price not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      mode:                 'subscription',
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing`,
      metadata:           { user_id: req.user.id, plan, interval },
      subscription_data:  { metadata: { user_id: req.user.id, plan } }
    });

    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    console.error('[STRIPE]', err.message);
    res.status(500).json({ error: 'Checkout creation failed' });
  }
});

/* ── PayPal Checkout — DÉSACTIVÉ ──────────────────────────────
   La création d'abonnement PayPal n'est pas encore implémentée.
   Utiliser Stripe pour les paiements (pleinement fonctionnel).
   Réactiver cette route quand l'intégration PayPal sera complète.
──────────────────────────────────────────────────────────────── */
router.post('/checkout/paypal', requireAuth, (req, res) => {
  res.status(501).json({
    error:      'PayPal payments are not available yet. Please use Stripe.',
    code:       'PAYPAL_NOT_IMPLEMENTED',
    alternative:'Use POST /api/subscription/checkout/stripe'
  });
});

/* ── Annuler l'abonnement ── */
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    if (req.user.subscription_id) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.update(req.user.subscription_id, {
        cancel_at_period_end: true
      });
    }

    await supabase.from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    res.json({ message: 'Subscription will be cancelled at end of billing period' });
  } catch (err) {
    console.error('[CANCEL]', err.message);
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

/* ── Statut abonnement ── */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      plan:         req.user.plan,
      subscription: sub || null,
      billing_url:  sub?.provider === 'stripe' && req.user.stripe_customer_id
        ? await createBillingPortalUrl(req.user.stripe_customer_id)
        : null
    });
  } catch (err) {
    console.error('[STATUS]', err.message);
    res.status(500).json({ error: 'Status fetch failed' });
  }
});

/* ── Factures ── */
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ invoices: data || [] });
  } catch (err) {
    console.error('[INVOICES]', err.message);
    res.status(500).json({ error: 'Invoices fetch failed' });
  }
});

/* ── Helper : URL portail Stripe ── */
async function createBillingPortalUrl(customerId) {
  try {
    const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: process.env.FRONTEND_URL + '/account'
    });
    return session.url;
  } catch {
    return null;
  }
}

module.exports = router;
