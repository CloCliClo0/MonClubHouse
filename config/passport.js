const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Club } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
      let user = await User.findOne({ where: { google_id: profile.id } });

      if (!user) {
        user = await User.findOne({ where: { email: profile.emails[0].value } });
        if (user) {
          await user.update({ google_id: profile.id });
        } else {
          user = await User.create({
            nom: profile.displayName,
            prenom: profile.name.givenName || '',
            email: profile.emails[0].value,
            google_id: profile.id,
            avatar: profile.photos[0]?.value || null,
            role: 'joueur',
            actif: true
          });
        }
      }

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
