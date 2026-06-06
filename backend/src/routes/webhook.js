/**
 * Webhook Stripe et PayPal
 * POST /api/webhook/stripe
 * POST /api/webhook/paypal
 */
const router    = require('express').Router();
const express   = require('express');
const { getLimits } = require('../config/plans');

/* ── Stripe Webhook ── */
router.post('/stripe',
  async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;

try {

  console.log('BODY TYPE:', typeof req.body);
  console.log('IS BUFFER:', Buffer.isBuffer(req.body));
  console.log('BODY CONSTRUCTOR:', req.body?.constructor?.name);

  event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

} catch (err) {
  console.error('[WEBHOOK] Stripe signature error:', err.message);
  return res.status(400).send('Webhook signature verification failed');
}

    const supabase = req.app.locals.supabase;

    try {
      switch (event.type) {

        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId  = session.metadata?.user_id;
          const plan    = session.metadata?.plan;
          const subId   = session.subscription;
          if (!userId || !plan) break;

          /* Récupérer détails de l'abonnement */
          const sub = await stripe.subscriptions.retrieve(subId);

          /* Mettre à jour le plan utilisateur + quota_limit */
          await supabase.from('users')
            .update({
              plan,
              subscription_id: subId,
              status:          'active',
              quota_limit:     getLimits(plan).daily_analyses
            })
            .eq('id', userId);

          /* Créer entrée subscription */
          await supabase.from('subscriptions').upsert({
            user_id:             userId,
            plan,
            provider:            'stripe',
            provider_sub_id:     subId,
            status:              'active',
            amount:              sub.items.data[0]?.price?.unit_amount / 100,
            currency:            sub.currency,
            interval:            sub.items.data[0]?.price?.recurring?.interval,
            current_period_start:new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:  new Date(sub.current_period_end   * 1000).toISOString()
          }, { onConflict: 'provider_sub_id' });

          console.log(`[STRIPE] User ${userId} upgraded to ${plan}`);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const subId   = invoice.subscription;

          /* Enregistrer le paiement */
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id, id')
            .eq('provider_sub_id', subId)
            .single();

          if (sub) {
            await supabase.from('payments').insert({
              user_id:            sub.user_id,
              subscription_id:    sub.id,
              provider:           'stripe',
              provider_payment_id:invoice.payment_intent,
              amount:             invoice.amount_paid / 100,
              currency:           invoice.currency,
              status:             'succeeded'
            });

            /* Renouveler la période */
            const stripeSub = await stripe.subscriptions.retrieve(subId);
            await supabase.from('subscriptions')
              .update({
                status: 'active',
                current_period_start: new Date(stripeSub.current_period_start*1000).toISOString(),
                current_period_end:   new Date(stripeSub.current_period_end  *1000).toISOString()
              })
              .eq('provider_sub_id', subId);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('provider_sub_id', invoice.subscription);
          console.log('[STRIPE] Payment failed for sub:', invoice.subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          /* Rétrograder vers free */
          const { data: dbSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('provider_sub_id', sub.id)
            .single();

          if (dbSub) {
            await supabase.from('users')
              .update({
                plan:            'free',
                subscription_id: null,
                quota_limit:     getLimits('free').daily_analyses
              })
              .eq('id', dbSub.user_id);
            await supabase.from('subscriptions')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('provider_sub_id', sub.id);
            console.log(`[STRIPE] User ${dbSub.user_id} downgraded to free`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object;
          await supabase.from('subscriptions')
            .update({ status: sub.status })
            .eq('provider_sub_id', sub.id);
          break;
        }

        default:
          console.log('[STRIPE] Unhandled event:', event.type);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[WEBHOOK] Processing error:', err.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/* ── PayPal : récupérer un access token OAuth ── */
async function getPayPalAccessToken() {
  const apiBase = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('PayPal token fetch failed');
  return { token: data.access_token, apiBase };
}

/* ── PayPal : vérification HMAC de la signature webhook ── */
async function verifyPayPalSignature(headers, rawBody) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error('[PAYPAL] PAYPAL_WEBHOOK_ID non configuré dans .env');
    return false;
  }

  try {
    const { token, apiBase } = await getPayPalAccessToken();

    const res = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        auth_algo:         headers['paypal-auth-algo'],
        cert_url:          headers['paypal-cert-url'],
        transmission_id:   headers['paypal-transmission-id'],
        transmission_sig:  headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id:        webhookId,
        webhook_event:     JSON.parse(rawBody)
      })
    });

    const data = await res.json();
    return data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('[PAYPAL] Erreur vérification signature:', err.message);
    return false;
  }
}

/* ── PayPal : mapping plan_id → plan (tous les intervalles) ── */
function resolvePayPalPlan(planId) {
  const map = {
    [process.env.PAYPAL_PLAN_PRO_MONTHLY]:      'pro',
    [process.env.PAYPAL_PLAN_PRO_YEARLY]:        'pro',
    [process.env.PAYPAL_PLAN_BUSINESS_MONTHLY]:  'business',
    [process.env.PAYPAL_PLAN_BUSINESS_YEARLY]:   'business'
  };
  return map[planId] || null;
}

/* ── PayPal Webhook ── */
router.post('/paypal', async (req, res) => {
  /* Vérifier la signature avant tout traitement */
  const isValid = await verifyPayPalSignature(req.headers, req.body);
  if (!isValid) {
    console.error('[PAYPAL] Signature invalide — requête rejetée');
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    const event    = JSON.parse(req.body);
    const supabase = req.app.locals.supabase;

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const sub    = event.resource;
        const userId = sub.custom_id;
        const plan   = resolvePayPalPlan(sub.plan_id);

        if (!userId || !plan) {
          console.error('[PAYPAL] custom_id ou plan_id manquant:', sub.id);
          break;
        }

        await supabase.from('users')
          .update({
            plan,
            paypal_sub_id: sub.id,
            status:        'active',
            quota_limit:   getLimits(plan).daily_analyses
          })
          .eq('id', userId);

        await supabase.from('subscriptions').upsert({
          user_id:         userId,
          plan,
          provider:        'paypal',
          provider_sub_id: sub.id,
          status:          'active'
        }, { onConflict: 'provider_sub_id' });

        console.log(`[PAYPAL] User ${userId} activé → ${plan}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const sub = event.resource;
        const { data: dbUser } = await supabase
          .from('users').select('id').eq('paypal_sub_id', sub.id).single();

        if (dbUser) {
          await supabase.from('users')
            .update({
              plan:          'free',
              paypal_sub_id: null,
              quota_limit:   getLimits('free').daily_analyses
            })
            .eq('id', dbUser.id);
          await supabase.from('subscriptions')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('provider_sub_id', sub.id);
          console.log(`[PAYPAL] User ${dbUser.id} rétrogradé → free`);
        }
        break;
      }

      default:
        console.log('[PAYPAL] Événement non géré:', event.event_type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[PAYPAL] Erreur traitement:', err.message);
    res.status(500).json({ error: 'PayPal webhook failed' });
  }
});

module.exports = router;
