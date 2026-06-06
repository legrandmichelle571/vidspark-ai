/**
 * VidSpark AI — Plan Definitions (Extension)
 * ════════════════════════════════════════════════════════════════
 * MIRROR of backend/src/config/plans.js
 * Used by paywall.js, content.js, and background.js
 *
 * ⚠️  IMPORTANT: Must match backend and frontend exactly
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',

    // Feature limits
    limits: {
      monthly_analyses: 10,
      monthly_reports: 0,
      monthly_titles: 0,
      max_channels: 1
    }
  },

  pro: {
    id: 'pro',
    name: 'Pro',

    // Feature limits
    limits: {
      monthly_analyses: 500,
      monthly_reports: 100,
      monthly_titles: -1,  // unlimited
      max_channels: 1  // ⚠️ SAME as FREE
    }
  },

  business: {
    id: 'business',
    name: 'Business',

    // Feature limits
    limits: {
      monthly_analyses: 10000,
      monthly_reports: 5000,
      monthly_titles: -1,  // unlimited
      max_channels: 5  // ⚠️ with same owner check
    }
  }
};

/**
 * Feature access configuration
 * Used by paywall.js to determine visibility and blur
 */
const FEATURES = {
  analyze: {
    name: 'Analyze',
    requiredPlan: 'free',
    description: 'Analyze YouTube videos'
  },
  aiReport: {
    name: 'AI Reports',
    requiredPlan: 'pro',
    description: 'Generate AI-powered reports'
  },
  aiTitles: {
    name: 'AI Titles',
    requiredPlan: 'business',
    description: 'Generate AI-powered titles'
  },
  multiChannel: {
    name: 'Multi-Channel',
    requiredPlan: 'business',
    description: 'Track multiple channels'
  }
};

/**
 * Get plan by ID
 */
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

/**
 * Get plan hierarchy level
 * Used to check if user has access to a feature
 */
function getPlanLevel(planId) {
  const levels = { free: 0, pro: 1, business: 2 };
  return levels[planId] || 0;
}

/**
 * Check if user can access a feature
 * @param {string} planId - 'free', 'pro', 'business'
 * @param {string} feature - feature key from FEATURES
 * @returns {boolean}
 */
function canAccessFeature(planId, feature) {
  const featureConfig = FEATURES[feature];
  if (!featureConfig) return false;

  const userLevel = getPlanLevel(planId);
  const requiredLevel = getPlanLevel(featureConfig.requiredPlan);

  return userLevel >= requiredLevel;
}

/**
 * Get monthly limit for a plan
 */
function getMonthlyLimit(planId) {
  const plan = getPlan(planId);
  return plan.limits.monthly_analyses;
}

/**
 * Get max channels for a plan
 */
function getMaxChannels(planId) {
  const plan = getPlan(planId);
  return plan.limits.max_channels;
}

/**
 * Get badge color by plan
 */
function getPlanColor(planId) {
  const colors = {
    free: '#22c55e',
    pro: '#7c6dfa',
    business: '#3b82f6'
  };
  return colors[planId] || colors.free;
}

/**
 * Get badge text by plan
 */
function getPlanBadge(planId) {
  const badges = {
    free: 'FREE',
    pro: 'PRO',
    business: 'BUSINESS'
  };
  return badges[planId] || 'FREE';
}

/**
 * Log all plans (for debugging in content script)
 */
function logPlans() {
  console.log('[Plans Config] ═══════════════════════════════════════');
  Object.values(PLANS).forEach(plan => {
    console.log(`\n${plan.name} (${plan.id}):`);
    console.log(`  Analyses: ${plan.limits.monthly_analyses}/month`);
    console.log(`  Reports: ${plan.limits.monthly_reports}/month`);
    console.log(`  Max Channels: ${plan.limits.max_channels}`);
  });
  console.log('\n═══════════════════════════════════════════════════════\n');
}

/**
 * Validate current user plan
 * Called by background.js when syncing with backend
 */
function validatePlan(planId) {
  return PLANS.hasOwnProperty(planId);
}
