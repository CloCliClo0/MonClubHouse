const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, refresh, logout, googleCallback, me, forgotPassword, resetPassword, cancelGooglePending, verify2fa, verifyEmail } = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validation');

router.post('/register',        optionalAuth, validateRegister, register);
router.post('/login',           validateLogin, login);
router.post('/refresh',         refresh);
router.post('/logout',          authenticate, logout);
router.get('/me',               authenticate, me);
router.post('/forgot-password',          forgotPassword);
router.post('/reset-password',           resetPassword);
router.delete('/cancel-google-pending',  authenticate, cancelGooglePending);
router.post('/verify-2fa',  verify2fa);
router.get('/verify-email', verifyEmail);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  googleCallback
);

module.exports = router;
