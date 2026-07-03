const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Limite de requêtes atteinte.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 30,
  message: { success: false, message: 'Limite d\'upload atteinte.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter spécifique pour l'IA (requêtes coûteuses)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 15,
  message: { success: false, message: 'Limite d\'analyse IA atteinte. Réessayez dans une heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter pour reset-password (anti-brute-force sur email)
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  message: { success: false, message: 'Trop de demandes de réinitialisation. Réessayez dans une heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, uploadLimiter, aiLimiter, resetPasswordLimiter };
