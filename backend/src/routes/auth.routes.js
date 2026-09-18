const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateUser } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiters,
  guestLimiters, forgotPasswordLimiter
} = require('../middleware/rateLimit');

// ---------- PUBLIC (rate limited) ----------
router.post('/register', registerLimiters, authController.register);
router.post('/guest',    guestLimiters,    authController.guest);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/login',    loginLimiter,     authController.login);

// ---------- AUTHENTICATED ----------
router.post('/logout', authenticateUser, authController.logout);
router.get('/me',      authenticateUser, authController.me);

module.exports = router;