/**
 * Quota Checking Middleware
 * Ensure user hasn't exceeded quota
 */

const subscriptionService = require('../services/subscriptionService');
const { QuotaExceededError } = require('../utils/errors');

/**
 * Check if user can perform action
 */
const checkQuota = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const quota = await subscriptionService.checkQuota(req.user.userId);
    req.quota = quota;

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Increment quota after successful action
 */
const incrementQuota = async (userId, amount = 1) => {
  try {
    await subscriptionService.useQuota(userId, amount);
  } catch (err) {
    console.error('Failed to increment quota:', err);
  }
};

module.exports = {
  checkQuota,
  incrementQuota
};
