/**
 * Payment Service
 * Stripe integration for subscription management
 */

const { stripe } = require('../config/stripe');
const { supabase } = require('../config/supabase');
const { PaymentError, NotFoundError } = require('../utils/errors');

const PLANS = {
  pro: {
    stripe_price_id: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    amount: 999, // $9.99
    name: 'Pro'
  },
  business: {
    stripe_price_id: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
    amount: 2999, // $29.99
    name: 'Business'
  }
};

class PaymentService {
  /**
   * Create checkout session
   */
  async createCheckoutSession(userId, planId) {
    const plan = PLANS[planId];
    if (!plan) {
      throw new PaymentError('Invalid plan');
    }

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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/upgrade`,
      metadata: {
        userId,
        planId
      }
    });

    return session;
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    return await stripe.subscriptions.del(subscriptionId);
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(subscriptionId, newPriceId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId
        }
      ],
      proration_behavior: 'create_prorations'
    });
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, limit = 50) {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return payments;
  }

  /**
   * Create refund
   */
  async refundPayment(chargeId, reason) {
    return await stripe.refunds.create({
      charge: chargeId,
      reason: 'requested_by_customer',
      metadata: { reason }
    });
  }
}

module.exports = new PaymentService();
