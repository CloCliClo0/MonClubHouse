const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Club } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// JWT Strategy
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  async (payload, done) => {
    try {
      const user = await User.findByPk(payload.id, {
        attributes: { exclude: ['password_hash', 'refresh_token'] }
      });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let isNew = false;
      let user = await User.findOne({ where: { google_id: profile.id } });

      if (!user) {
        user = await User.findOne({ where: { email: profile.emails[0].value } });
        if (user) {
          // Compte existant via email — on lie le Google ID
          await user.update({ google_id: profile.id });
        } else {
          // Nouveau compte — role 'visiteur' en attente de code d'accès
          user = await User.create({
            nom: profile.displayName || profile.name?.familyName || '',
            prenom: profile.name?.givenName || '',
            email: profile.emails[0].value,
            google_id: profile.id,
            avatar: profile.photos[0]?.value || null,
            role: 'visiteur',
            actif: true
          });
          isNew = true;
        }
      }

      // Attacher le flag au user pour que googleCallback puisse l'utiliser
      user.dataValues._isNew = isNew;
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
