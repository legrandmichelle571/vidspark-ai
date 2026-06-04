/**
 * Payments Routes - Stripe Integration
 */

const express = require('express');
const { stripe } = require('../config/stripe');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { NotFoundError, PaymentError } = require('../utils/errors');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

// GET /api/payments/plans
router.get('/plans', (req, res) => {
  const plans = subscriptionService.getPlans();
  res.json({
    success: true,
    data: plans
  });
});

// POST /api/payments/checkout - Create checkout session
router.post('/checkout', requireAuth, validate('createCheckout'), async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    const planData = subscriptionService.getPlan(plan);
    if (!planData || !planData.stripe_price_id) {
      throw new PaymentError('Invalid plan selected');
    }

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planData.stripe_price_id,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/upgrade`,
      metadata: {
        userId,
        planId: plan
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/history - Payment history
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const { data: payments, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/invoices - Get invoices
router.get('/invoices', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return res.json({
        success: true,
        data: []
      });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 50
    });

    res.json({
      success: true,
      data: invoices.data
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/cancel-subscription
router.post('/cancel-subscription', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await subscriptionService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription cancelled. Downgraded to FREE plan.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/update-plan
router.post('/update-plan', requireAuth, validate('updatePlan'), async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    const result = await subscriptionService.upgradePlan(userId, plan, null);

    res.json({
      success: true,
      message: `Plan updated to ${plan}`,
      data: { plan }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
