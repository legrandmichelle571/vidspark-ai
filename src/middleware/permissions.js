/**
 * Permission Middleware
 * Role-based access control
 */

const { supabase } = require('../config/supabase');
const { AuthorizationError } = require('../utils/errors');

/**
 * Require specific role
 */
const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.userId)
        .single();

      if (!user) {
        throw new AuthorizationError('User not found');
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(user.role)) {
        throw new AuthorizationError(`Role '${user.role}' is not authorized`);
      }

      req.user.role = user.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};

/**
 * Check if user owns resource
 */
const checkOwnership = async (userId, resourceId, tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('user_id')
    .eq('id', resourceId)
    .single();

  if (error || !data) {
    throw new AuthorizationError('Resource not found');
  }

  if (data.user_id !== userId) {
    throw new AuthorizationError('You do not own this resource');
  }

  return true;
};

/**
 * Ownership check middleware
 */
const ownershipMiddleware = (tableName) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.userId;

      await checkOwnership(userId, resourceId, tableName);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  checkOwnership,
  ownershipMiddleware
};
