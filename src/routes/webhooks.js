/**
 * Webhooks Routes
 * Handle Stripe webhook events
 */

const express = require('express');
const { stripe } = require('../config/stripe');
const { supabase } = require('../config/supabase');
const paymentService = require('../services/paymentService');

const router = express.Router();

// POST /api/webhooks/stripe
// Stripe will POST here when events happen
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`[Webhook] Received ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // === CHECKOUT ===
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      // === SUBSCRIPTIONS ===
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      // === INVOICES ===
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // === CHARGES ===
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ============================================
// Event Handlers
// ============================================

async function handleCheckoutSessionCompleted(session) {
  console.log('[Webhook] Checkout completed:', session.id);

  const userId = session.metadata.userId;
  const planId = session.metadata.planId;
  const customerId = session.customer;

  if (!userId || !planId) {
    console.error('[Webhook] Missing userId or planId in metadata');
    return;
  }

  try {
    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Update user with subscription info
    await supabase
      .from('users')
      .update({
        plan: planId,
        subscription_id: subscription.id,
        subscription_status: 'active',
        plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: customerId,
        monthly_limit: getMonthlyLimit(planId)
      })
      .eq('id', userId);

    // Create subscription record
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      status: 'active'
    });

    console.log(`[Webhook] Subscription created for user ${userId}`);
  } catch (err) {
    console.error('[Webhook] Error handling checkout:', err);
  }
}

async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.warn('[Webhook] User not found for customer:', customerId);
    return;
  }

  console.log('[Webhook] Subscription created for user:', user.id);
}

async function handleSubscriptionUpdated(subscription) {
  const { data } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000)
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log('[Webhook] Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('subscription_id', subscription.id)
    .single();

  if (!user) return;

  // Downgrade to free plan
  await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_id: null,
      subscription_status: 'cancelled',
      monthly_limit: 10
    })
    .eq('id', user.id);

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);

  console.log('[Webhook] Subscription cancelled for user:', user.id);
}

async function handleInvoicePaymentSucceeded(invoice) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (!user) return;

  // Create payment record
  await supabase.from('payments').insert({
    user_id: user.id,
    stripe_invoice_id: invoice.id,
    stripe_charge_id: invoice.charge,
    amount: invoice.amount_paid,
    status: 'succeeded'
  });

  console.log('[Webhook] Payment succeeded for user:', user.id);
}

async function handleInvoicePaymentFailed(invoice) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (!user) return;

  await supabase.from('payments').insert({
    user_id: user.id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due,
    status: 'failed'
  });

  console.log('[Webhook] Payment failed for user:', user.id);
}

async function handleChargeRefunded(charge) {
  if (charge.payment_intent) {
    await supabase
      .from('payments')
      .update({
        refunded: true,
        refund_amount: charge.amount_refunded,
        refunded_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', charge.payment_intent);

    console.log('[Webhook] Payment refunded:', charge.payment_intent);
  }
}

function getMonthlyLimit(planId) {
  const limits = {
    free: 10,
    pro: 500,
    business: 5000,
    enterprise: -1
  };
  return limits[planId] || 10;
}

module.exports = router;
