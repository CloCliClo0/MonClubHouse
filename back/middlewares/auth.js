const passport = require('../config/passport');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

module.exports = { authenticate, optionalAuth };
