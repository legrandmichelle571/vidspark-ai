/**
 * Subscription Service
 * Manages user subscriptions, plans, and quotas
 */

const { supabase } = require('../config/supabase');
const { QuotaExceededError, NotFoundError, PaymentError } = require('../utils/errors');

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthly_analyses: 10,
    monthly_reports: 0,
    max_projects: 1,
    max_videos: 5,
    ai_providers: ['openai'],
    support: 'community'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999, // $9.99
    monthly_analyses: 500,
    monthly_reports: 100,
    max_projects: 10,
    max_videos: 100,
    ai_providers: ['openai', 'claude', 'gemini'],
    support: 'email'
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 2999, // $29.99
    monthly_analyses: 5000,
    monthly_reports: 500,
    max_projects: 50,
    max_videos: 1000,
    ai_providers: ['openai', 'claude', 'gemini', 'deepseek'],
    support: 'priority'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    monthly_analyses: -1, // Unlimited
    monthly_reports: -1,
    max_projects: -1,
    max_videos: -1,
    ai_providers: ['openai', 'claude', 'gemini', 'deepseek'],
    support: 'dedicated'
  }
};

class SubscriptionService {
  /**
   * Get all plans
   */
  getPlans() {
    return PLANS;
  }

  /**
   * Get specific plan
   */
  getPlan(planId) {
    return PLANS[planId] || null;
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, plan, subscription_id, subscription_status, plan_expires_at, monthly_usage, monthly_limit')
      .eq('id', userId)
      .single();

    if (error) {
      throw new NotFoundError('User not found');
    }

    const plan = this.getPlan(user.plan);

    return {
      user: user.id,
      plan: user.plan,
      subscription_id: user.subscription_id,
      subscription_status: user.subscription_status,
      plan_expires_at: user.plan_expires_at,
      usage: {
        monthly_usage: user.monthly_usage,
        monthly_limit: user.monthly_limit
      },
      features: plan
    };
  }

  /**
   * Check if user can perform action
   */
  async checkQuota(userId, creditsNeeded = 1) {
    const { data: user, error } = await supabase
      .from('users')
      .select('plan, monthly_usage, monthly_limit, subscription_status, plan_expires_at')
      .eq('id', userId)
      .single();

    if (error) {
      throw new NotFoundError('User not found');
    }

    // Check if subscription is expired
    if (user.plan !== 'free' && user.plan_expires_at) {
      if (new Date(user.plan_expires_at) < new Date()) {
        // Downgrade to free
        await supabase
          .from('users')
          .update({
            plan: 'free',
            subscription_status: 'expired',
            monthly_limit: 10
          })
          .eq('id', userId);

        user.plan = 'free';
        user.monthly_limit = 10;
      }
    }

    // Check FREE plan quota
    if (user.plan === 'free' && user.monthly_usage >= user.monthly_limit) {
      throw new QuotaExceededError('Monthly quota exceeded', {
        plan: user.plan,
        used: user.monthly_usage,
        limit: user.monthly_limit,
        reset_date: this.getQuotaResetDate()
      });
    }

    return {
      plan: user.plan,
      monthly_usage: user.monthly_usage,
      monthly_limit: user.monthly_limit,
      can_proceed: true
    };
  }

  /**
   * Use quota (increment usage)
   */
  async useQuota(userId, amount = 1) {
    const { data, error } = await supabase
      .from('users')
      .update({
        monthly_usage: supabase.sql`monthly_usage + ${amount}`
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new PaymentError('Failed to update quota');
    }

    return data;
  }

  /**
   * Reset monthly quota (runs on 1st of month)
   */
  async resetMonthlyQuota(userId) {
    const plan = await this.getPlan(userId);
    const limit = plan?.monthly_analyses || 10;

    const { error } = await supabase
      .from('users')
      .update({
        monthly_usage: 0,
        monthly_limit: limit
      })
      .eq('id', userId);

    if (error) {
      throw new PaymentError('Failed to reset quota');
    }

    return { success: true };
  }

  /**
   * Get quota reset date
   */
  getQuotaResetDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  /**
   * Check if user can access AI provider
   */
  async canAccessProvider(userId, provider) {
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const plan = this.getPlan(user.plan);
    return plan.ai_providers.includes(provider);
  }

  /**
   * Get user's available features
   */
  async getFeatures(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.getPlan(user.plan);
  }

  /**
   * Upgrade user plan
   */
  async upgradePlan(userId, newPlanId, subscriptionId) {
    const newPlan = this.getPlan(newPlanId);
    if (!newPlan) {
      throw new PaymentError('Invalid plan');
    }

    const { error } = await supabase
      .from('users')
      .update({
        plan: newPlanId,
        subscription_id: subscriptionId,
        subscription_status: 'active',
        plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        monthly_limit: newPlan.monthly_analyses,
        monthly_usage: 0 // Reset usage on upgrade
      })
      .eq('id', userId);

    if (error) {
      throw new PaymentError('Failed to upgrade plan');
    }

    return { success: true };
  }

  /**
   * Downgrade to free plan
   */
  async downgradePlan(userId) {
    const { error } = await supabase
      .from('users')
      .update({
        plan: 'free',
        subscription_id: null,
        subscription_status: null,
        plan_expires_at: null,
        monthly_limit: 10,
        monthly_usage: 0
      })
      .eq('id', userId);

    if (error) {
      throw new PaymentError('Failed to downgrade plan');
    }

    return { success: true };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    await this.downgradePlan(userId);
    return { success: true };
  }
}

module.exports = new SubscriptionService();
