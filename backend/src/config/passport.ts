import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models';
import type { JwtPayload } from '../types';

// ── JWT Strategy ──────────────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. httpOnly cookie (production)
        (req) => req?.cookies?.access_token ?? null,
        // 2. Bearer header (fallback dev)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload: JwtPayload, done) => {
      try {
        const user = await User.findByPk(payload.id);
        if (!user || !user.actif) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// ── Google OAuth Strategy ─────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Email Google manquant'), undefined);

        let user = await User.findOne({ where: { google_id: profile.id } });

        if (!user) {
          user = await User.findOne({ where: { email } });
          if (user) {
            await user.update({ google_id: profile.id });
          } else {
            user = await User.create({
              nom: profile.name?.familyName ?? profile.displayName,
              prenom: profile.name?.givenName ?? '',
              email,
              google_id: profile.id,
              avatar: profile.photos?.[0]?.value ?? null,
              role: 'joueur',
              actif: true,
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;
