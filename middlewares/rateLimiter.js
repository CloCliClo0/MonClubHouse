const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Limite de requêtes atteinte.' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 50,
  message: { success: false, message: 'Limite d\'upload atteinte.' }
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };
