const { User, InviteCode, Equipe, Licencie, Category } = require('../models');
const { Op } = require('sequelize');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { send2faEmail, sendVerifyEmail } = require('../services/emailService');
const { assignUserToEquipes, equipeIdsForCategory, equipeIdsForCategoryByName } = require('../services/rosterService');

// Helper — envoie l'email de vérification sans bloquer la réponse
function sendEmailVerification(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.update({ email_verify_token: token, email_verify_expires: expires })
    .then(() => sendVerifyEmail({ user, token }))
    .catch(err => console.warn('[Email] Vérification non envoyée :', err.message));
}

// Stockage en mémoire des tokens de réinitialisation (TTL 30 min)
const resetTokens = new Map(); // token → { email, expires }
// Codes one-time OAuth (TTL 60s) — évite d'exposer les JWTs en query string
const oauthCodes = new Map(); // code → { accessToken, refreshToken, isNew, expires }

// Purge périodique des Maps (évite la fuite mémoire sur long-running server)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of resetTokens) { if (now > v.expires) resetTokens.delete(k); }
  for (const [k, v] of oauthCodes)  { if (now > v.expires) oauthCodes.delete(k); }
}, 5 * 60 * 1000);

let _noReplyTransporter = null;
function getNoReplyTransporter() {
  if (_noReplyTransporter) return _noReplyTransporter;
  _noReplyTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER_NO_REPLY,
      pass: process.env.SMTP_PASS_NO_REPLY,
    },
  });
  return _noReplyTransporter;
}

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { nom, prenom, email, password, invite_code } = req.body;

    // Les admins peuvent créer des comptes directement sans code
    const isAdminRequest = req.user && ['superadmin', 'admin', 'dirigeant'].includes(req.user.role);

    // Pour une inscription publique, le code est obligatoire
    if (!isAdminRequest) {
      if (!invite_code) {
        return res.status(400).json({ success: false, message: 'Un code d\'invitation est requis pour créer un compte.' });
      }

      const invite = await InviteCode.findOne({
        where: {
          code:  invite_code.toUpperCase().trim(),
          actif: true,
          [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
        },
        include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'], required: false,
          include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] }],
      });

      if (!invite) {
        return res.status(400).json({ success: false, message: 'Code d\'invitation invalide ou expiré.' });
      }
      // Vérification rapide (non-bloquante) — le verrou réel est l'UPDATE atomique plus bas
      if (invite.uses_count >= invite.max_uses) {
        return res.status(400).json({ success: false, message: 'Ce code a atteint sa limite d\'utilisation.' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });
      }

      // Créer le compte avec le rôle et club du code
      const user = await User.create({
        nom, prenom: prenom || '', email,
        password_hash: password,
        role:    invite.role,
        club_id: invite.club_id,
        actif:   true,
      });

      // Affectation à la catégorie (toutes les équipes actives) ou, à défaut, à l'équipe précise du code.
      // Un code catégorie (equipe_id null) résout la catégorie par son nom (InviteCode.categorie = texte libre).
      if (['joueur', 'parent', 'coach'].includes(invite.role)) {
        let equipeIds = [];
        if (invite.equipe_id) {
          equipeIds = invite.equipe?.categorie_id
            ? await equipeIdsForCategory({ clubId: invite.club_id, categorieId: invite.equipe.categorie_id })
            : [invite.equipe_id];
        } else if (invite.categorie) {
          equipeIds = await equipeIdsForCategoryByName({ clubId: invite.club_id, categorieName: invite.categorie });
        }

        if (equipeIds.length > 0) {
          await assignUserToEquipes({ userId: user.id, clubId: invite.club_id, equipeIds, role: invite.role });
        } else if (invite.role !== 'coach') {
          // Ni équipe ni catégorie résolue : licencié rattaché au club sans équipe (joueur/parent uniquement)
          await Licencie.findOrCreate({
            where: { user_id: user.id },
            defaults: { user_id: user.id, equipe_id: null, club_id: invite.club_id, statut: 'actif' },
          });
        }
      }

      // Incrément atomique (optimistic locking) — évite la race condition entre requêtes concurrentes
      const [nbUpdated] = await InviteCode.update(
        { uses_count: invite.uses_count + 1 },
        { where: { id: invite.id, uses_count: invite.uses_count } }
      );
      if (nbUpdated === 0) {
        // Annuler la création du compte (code quota atteint entre-temps)
        await user.destroy();
        return res.status(400).json({ success: false, message: 'Ce code a atteint sa limite d\'utilisation.' });
      }

      const payload = { id: user.id, role: user.role, club_id: user.club_id };
      const accessToken  = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);
      await user.update({ refresh_token: refreshToken });

      sendEmailVerification(user);

      return res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        data: {
          user: user.toSafeJSON(),
          access_token:  accessToken,
          refresh_token: refreshToken,
          invite_role:   invite.role,
        },
      });
    }

    // ── Création admin : sans code, rôle libre ──────────────────────
    const { role, club_id } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });
    }

    // Seul un superadmin peut créer un compte admin ou superadmin
    const assignableRoles = req.user.role === 'superadmin'
      ? ['joueur', 'parent', 'coach', 'dirigeant', 'admin', 'superadmin']
      : ['joueur', 'parent', 'coach', 'dirigeant'];
    const safeRole = assignableRoles.includes(role) ? role : 'joueur';
    // Superadmin peut définir un club_id, les autres admins utilisent le leur
    const userClubId = req.user.role === 'superadmin'
      ? (club_id ? parseInt(club_id) : null)
      : (req.user.club_id || null);

    const user = await User.create({
      nom, prenom: prenom || '', email,
      password_hash: password,
      role: safeRole,
      club_id: userClubId,
      actif: true,
    });

    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await user.update({ refresh_token: refreshToken });

    sendEmailVerification(user);

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: { user: user.toSafeJSON(), access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, actif: true } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const valid = await user.verifyPassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // ── 2FA : si activée, envoyer un code et retourner un temp token ──
    if (user.two_fa_enabled) {
      const code = String(crypto.randomInt(100000, 1000000));
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.update({ two_fa_code: code, two_fa_expires: expires });
      send2faEmail({ user, code }).catch(() => {});
      const tempToken = jwt.sign(
        { two_fa_pending: true, user_id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ success: true, requires_2fa: true, temp_token: tempToken });
    }

    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({
      refresh_token: refreshToken,
      derniere_connexion: new Date()
    });

    return res.json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(401).json({ success: false, message: 'Refresh token manquant' });
    }

    const decoded = verifyRefreshToken(refresh_token);
    const user = await User.findOne({
      where: { id: decoded.id, refresh_token, actif: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await user.update({ refresh_token: newRefreshToken });

    return res.json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
  }
};

const logout = async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });
    return res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const isNew = user.dataValues._isNew === true;
    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({ refresh_token: refreshToken, derniere_connexion: new Date() });

    // Code one-time (60 s) — les tokens ne transitent plus en query string
    const code = crypto.randomBytes(32).toString('hex');
    oauthCodes.set(code, { accessToken, refreshToken, isNew, expires: Date.now() + 60_000 });

    const redirectUrl = `${process.env.APP_URL}/auth/callback?code=${code}${isNew ? '&new=1' : ''}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    return res.redirect(`${process.env.APP_URL}/login?error=oauth_failed`);
  }
};

// POST /api/auth/oauth-exchange — échange le code one-time contre les JWTs
const oauthExchange = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code manquant' });

  const entry = oauthCodes.get(code);
  if (!entry || Date.now() > entry.expires) {
    oauthCodes.delete(code);
    return res.status(400).json({ success: false, message: 'Code invalide ou expiré' });
  }
  oauthCodes.delete(code); // usage unique
  return res.json({ success: true, data: { access_token: entry.accessToken, refresh_token: entry.refreshToken, isNew: entry.isNew } });
};

const me = async (req, res) => {
  return res.json({ success: true, data: req.user.toSafeJSON() });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase().trim(), actif: true } });

    // Toujours répondre OK pour ne pas révéler si l'email existe
    if (!user) {
      return res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes
    resetTokens.set(token, { email: user.email, expires });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    const transporter = getNoReplyTransporter();
    await transporter.sendMail({
      from: `"MonClubHouse" <${process.env.SMTP_USER_NO_REPLY}>`,
      to: user.email,
      subject: '[MonClubHouse] Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);padding:32px 40px;text-align:center;">
            <span style="color:#fff;font-weight:900;font-size:22px;letter-spacing:-1px;">MCH</span>
            <p style="color:rgba(255,255,255,.7);font-size:12px;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px;">MonClubHouse</p>
          </div>
          <div style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#181a2e;font-size:22px;">Réinitialisation du mot de passe</h2>
            <p style="color:#404943;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Bonjour ${user.prenom || user.nom},<br/><br/>
              Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous — ce lien est valable <strong>30 minutes</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#0f5238;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color:#707973;font-size:13px;line-height:1.5;margin:0;">
              Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.<br/><br/>
              Ou copiez ce lien dans votre navigateur :<br/>
              <a href="${resetUrl}" style="color:#0f5238;word-break:break-all;">${resetUrl}</a>
            </p>
          </div>
          <div style="background:#f4f4f6;padding:20px 40px;text-align:center;border-top:1px solid #e8e8f0;">
            <p style="margin:0;font-size:12px;color:#707973;">© MonClubHouse — monclubhouse.fr</p>
          </div>
        </div>
      `,
    });

    console.log(`[Auth] Reset password email envoyé → ${user.email}`);
    return res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Mot de passe trop court (8 caractères min.)' });
  }

  const entry = resetTokens.get(token);
  if (!entry) {
    return res.status(400).json({ success: false, message: 'Lien invalide ou déjà utilisé.' });
  }
  if (Date.now() > entry.expires) {
    resetTokens.delete(token);
    return res.status(400).json({ success: false, message: 'Lien expiré. Faites une nouvelle demande.' });
  }

  try {
    const user = await User.findOne({ where: { email: entry.email, actif: true } });
    if (!user) return res.status(404).json({ success: false, message: 'Compte introuvable.' });

    await user.update({ password_hash: password }); // bcrypt hook s'en charge
    resetTokens.delete(token);

    return res.json({ success: true, message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/auth/cancel-google-pending — supprime un compte visiteur Google incomplet
const cancelGooglePending = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.json({ success: true });
    if (user.role === 'visiteur' && user.google_id && !user.club_id) {
      await user.destroy();
      return res.json({ success: true, deleted: true });
    }
    return res.json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/auth/verify-2fa — vérifie le code 2FA et retourne le JWT complet
const verify2fa = async (req, res) => {
  const { temp_token, code } = req.body;
  if (!temp_token || !code) {
    return res.status(400).json({ success: false, message: 'Paramètres manquants' });
  }
  try {
    const decoded = jwt.verify(temp_token, process.env.JWT_SECRET);
    if (!decoded.two_fa_pending) {
      return res.status(400).json({ success: false, message: 'Token invalide' });
    }
    const user = await User.findByPk(decoded.user_id);
    if (
      !user || !user.two_fa_code ||
      user.two_fa_code !== String(code).trim() ||
      !user.two_fa_expires || user.two_fa_expires < new Date()
    ) {
      return res.status(401).json({ success: false, message: 'Code invalide ou expiré' });
    }

    await user.update({ two_fa_code: null, two_fa_expires: null, derniere_connexion: new Date() });

    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await user.update({ refresh_token: refreshToken });

    return res.json({
      success: true,
      data: { user: user.toSafeJSON(), access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

// GET /api/auth/verify-email?token=... — confirme l'adresse email et redirige
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${process.env.APP_URL}/login?error=token_missing`);
  try {
    const user = await User.findOne({ where: { email_verify_token: token } });
    if (!user || !user.email_verify_expires || user.email_verify_expires < new Date()) {
      return res.redirect(`${process.env.APP_URL}/login?error=token_invalid`);
    }
    await user.update({ email_verified: true, email_verify_token: null, email_verify_expires: null });
    return res.redirect(`${process.env.APP_URL}/profil?tab=securite&verified=1`);
  } catch {
    return res.redirect(`${process.env.APP_URL}/login?error=server_error`);
  }
};

module.exports = { register, login, refresh, logout, googleCallback, oauthExchange, me, forgotPassword, resetPassword, cancelGooglePending, verify2fa, verifyEmail };
