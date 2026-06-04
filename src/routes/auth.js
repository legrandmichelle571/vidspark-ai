/**
 * Authentication Routes
 */

const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/signup', validate('signup'), authController.signup);
router.post('/login', validate('login'), authController.login);
router.post('/google', authController.googleLogin);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getProfile);
router.put('/me', requireAuth, validate('updateProfile'), authController.updateProfile);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
