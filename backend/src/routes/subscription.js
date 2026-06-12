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
const { getLimits }   = require('../config/plans');

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
    price_yearly:         95.90,
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
    price_yearly:         287.90,
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
  },
  {
    id:                   'diamant',
    name:                 'Diamant',
    price_monthly:        49.99,
    price_yearly:         539.89,
    stripe_price_monthly: process.env.STRIPE_PRICE_DIAMANT_MONTHLY,
    stripe_price_yearly:  process.env.STRIPE_PRICE_DIAMANT_YEARLY,
    features: [
      '5 000 analyses/jour',
      '2 000 titres IA/jour',
      'Tout Business +',
      '10 chaînes',
      '💎 Audit de chaîne avancé (site)',
      '💎 Rank Tracker (site)',
      'Support prioritaire'
    ],
    limits: {
      daily_analyses: 5000,
      daily_titles:   2000
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
    if (!['pro', 'business', 'diamant'].includes(plan)) {
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

/* ── Cryptomus Checkout (USDT) ── */
router.post('/checkout/cryptomus', requireAuth, async (req, res) => {
  try {
    const { plan, interval = 'month' } = req.body;
    if (!['pro', 'business', 'diamant'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const { createPaymentOrder } = require('../utils/cryptomus');
    const supabase = req.app.locals.supabase;

    /* Récupérer le prix du plan */
    const planData = PLANS.find(p => p.id === plan);
    const amount = interval === 'month' ? planData.price_monthly : planData.price_yearly;

    if (!amount || amount === 0) {
      return res.status(400).json({ error: 'Free plan cannot be paid' });
    }

    /* Créer une commande unique */
    const orderId = `${req.user.id}-${plan}-${Date.now()}`;
    const result = await createPaymentOrder({
      amount: Math.round(amount * 100) / 100,
      currency: 'USD',
      orderId,
      description: `VidSpark AI ${plan.toUpperCase()} - ${interval}ly`,
      metadata: {
        user_id: req.user.id,
        user_email: req.user.email,
        plan,
        interval
      }
    });

    if (!result.pay_url) {
      throw new Error('Cryptomus did not return payment URL');
    }

    res.json({
      checkout_url: result.pay_url,
      order_uuid: result.uuid,
      amount,
      currency: 'USD'
    });
  } catch (err) {
    console.error('[CRYPTOMUS]', err.message);
    res.status(500).json({ error: 'Checkout creation failed: ' + err.message });
  }
});

/* ── PayPal Checkout ── */
router.post('/checkout/paypal', requireAuth, async (req, res) => {
  try {
    const { plan, interval = 'month' } = req.body;
    if (!['pro', 'business', 'diamant'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const supabase = req.app.locals.supabase;

    /* Récupérer les credentials PayPal */
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const apiBase = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    /* Obtenir access token */
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get PayPal token');

    const accessToken = tokenData.access_token;

    /* Créer une commande (Orders API) */
    const planData = PLANS.find(p => p.id === plan);
    const amount = interval === 'month' ? planData.price_monthly : planData.price_yearly;

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `${req.user.id}-${plan}-${Date.now()}`,
          amount: {
            currency_code: 'USD',
            value: amount.toString()
          },
          description: `VidSpark AI ${plan.toUpperCase()} - ${interval}ly`
        }
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/success?type=paypal&plan=${plan}`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing`,
        user_action: 'PAY_NOW'
      }
    };

    const orderRes = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${req.user.id}-${Date.now()}`
      },
      body: JSON.stringify(orderBody)
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData.id) {
      console.error('[PAYPAL] Order creation failed:', orderData);
      throw new Error(orderData.message || 'Failed to create PayPal order');
    }

    /* Trouver le lien d'approbation */
    const approveLink = orderData.links.find(l => l.rel === 'approve');
    if (!approveLink) throw new Error('No approve link in PayPal response');

    res.json({
      checkout_url: approveLink.href,
      order_id: orderData.id,
      plan,
      interval,
      amount
    });
  } catch (err) {
    console.error('[PAYPAL]', err.message);
    res.status(500).json({ error: 'PayPal checkout failed: ' + err.message });
  }
});

/* ── Capturer le paiement PayPal + activer le plan ──────────────
   Appelé par la page /success au retour de PayPal.
   Sécurité : le plan est déduit du MONTANT réellement payé (non
   falsifiable), et la commande doit appartenir à l'utilisateur. ── */
router.post('/paypal/capture', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId requis' });

    const clientId     = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode         = process.env.PAYPAL_MODE || 'sandbox';
    if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');
    const apiBase = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    /* Token d'accès */
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get PayPal token');

    /* Capturer la commande */
    const capRes = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' }
    });
    const cap = await capRes.json();
    if (!capRes.ok || cap.status !== 'COMPLETED') {
      console.error('[PAYPAL/CAPTURE] non complété:', JSON.stringify(cap).slice(0, 400));
      return res.status(400).json({ error: 'Paiement non complété' });
    }

    /* Vérifier que la commande appartient bien à cet utilisateur */
    const pu = (cap.purchase_units && cap.purchase_units[0]) || {};
    if (!String(pu.reference_id || '').startsWith(req.user.id)) {
      return res.status(403).json({ error: 'Commande non associée à cet utilisateur' });
    }

    /* Déduire le plan du montant payé (non falsifiable) */
    const capture = pu.payments?.captures?.[0] || {};
    const amount  = parseFloat(capture.amount?.value || pu.amount?.value || '0');
    let plan = null, interval = null;
    for (const p of PLANS) {
      if (p.id === 'free') continue;
      if (Math.abs((p.price_monthly || 0) - amount) < 0.01) { plan = p.id; interval = 'month'; break; }
      if (Math.abs((p.price_yearly  || 0) - amount) < 0.01) { plan = p.id; interval = 'year';  break; }
    }
    if (!plan) return res.status(400).json({ error: 'Aucun plan ne correspond au montant payé' });

    /* Activer le plan (même logique que les webhooks) */
    const supabase = req.app.locals.supabase;
    const now = new Date();
    const endDate = interval === 'year'
      ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
      : new Date(new Date(now).setMonth(now.getMonth() + 1));

    await supabase.from('users').update({
      plan, status: 'active', quota_limit: getLimits(plan).daily_analyses
    }).eq('id', req.user.id);

    await supabase.from('subscriptions').upsert({
      user_id: req.user.id, plan, provider: 'paypal',
      provider_sub_id: orderId, status: 'active',
      amount, currency: 'USD', interval,
      current_period_start: now.toISOString(), current_period_end: endDate.toISOString()
    }, { onConflict: 'provider_sub_id' });

    await supabase.from('payments').insert({
      user_id: req.user.id, email: req.user.email, provider: 'paypal',
      provider_payment_id: capture.id || orderId,
      amount, currency: 'USD', status: 'succeeded'
    });

    console.log(`[PAYPAL/CAPTURE] User ${req.user.id} → ${plan} (${interval})`);
    res.json({ success: true, plan, interval, amount });
  } catch (err) {
    console.error('[PAYPAL/CAPTURE]', err.message);
    res.status(500).json({ error: 'Capture échouée: ' + err.message });
  }
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
