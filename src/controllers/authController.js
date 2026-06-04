/**
 * Authentication Controller
 * Handles HTTP requests for auth
 */

const authService = require('../services/authService');
const { validateRequest, schemas } = require('../utils/validators');
const { ValidationError, AuthenticationError } = require('../utils/errors');

class AuthController {
  /**
   * POST /api/auth/signup
   */
  async signup(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Validate
      const errors = validateRequest(schemas.signup, { email, password, name });
      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      const result = await authService.signup(email, password, name);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate
      const errors = validateRequest(schemas.login, { email, password });
      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      const result = await authService.login(email, password);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/google
   */
  async googleLogin(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ValidationError('Google token required');
      }

      const result = await authService.googleLogin(token);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token required');
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email required');
      }

      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        message: 'Password reset email sent if account exists'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/reset-password/:token
   */
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        throw new ValidationError('Password required');
      }

      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const userId = req.user.userId;

      await authService.logout(userId);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await authService.getUserProfile(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/auth/me
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const updates = req.body;

      // Validate
      const errors = validateRequest(schemas.updateProfile, updates);
      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      const user = await authService.updateProfile(userId, updates);

      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Validate
      const errors = validateRequest(schemas.changePassword, {
        currentPassword,
        newPassword
      });
      if (errors) {
        throw new ValidationError('Validation failed', errors);
      }

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
