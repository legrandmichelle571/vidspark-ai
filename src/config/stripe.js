/**
 * Stripe Configuration
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripe_price_id: null,
    features: {
      monthly_analyses: 10,
      monthly_reports: 0,
      max_projects: 1,
      max_videos: 5,
      ai_providers: ['openai'],
      support: 'community'
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999, // $9.99
    stripe_price_id: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    features: {
      monthly_analyses: 500,
      monthly_reports: 100,
      max_projects: 10,
      max_videos: 100,
      ai_providers: ['openai', 'claude', 'gemini'],
      support: 'email'
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 2999, // $29.99
    stripe_price_id: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
    features: {
      monthly_analyses: 5000,
      monthly_reports: 500,
      max_projects: 50,
      max_videos: 1000,
      ai_providers: ['openai', 'claude', 'gemini', 'deepseek'],
      support: 'priority'
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    stripe_price_id: null,
    features: {
      monthly_analyses: -1, // Unlimited
      monthly_reports: -1,
      max_projects: -1,
      max_videos: -1,
      ai_providers: ['openai', 'claude', 'gemini', 'deepseek'],
      support: 'dedicated'
    }
  }
};

module.exports = { stripe, PLANS };
