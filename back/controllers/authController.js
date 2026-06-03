const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Stockage en mémoire des tokens de réinitialisation (TTL 30 min)
// Suffisant pour un serveur mono-process comme Hostinger Node.js
const resetTokens = new Map(); // token → { email, expires }

function getNoReplyTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER_NO_REPLY,
      pass: process.env.SMTP_PASS_NO_REPLY,
    },
  });
}

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { nom, prenom, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
    }

    const safeRole = ['joueur', 'parent', 'visiteur'].includes(role) ? role : 'joueur';

    const user = await User.create({
      nom, prenom: prenom || '', email,
      password_hash: password,
      role: safeRole,
      actif: true
    });

    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({ refresh_token: refreshToken });

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: user.toSafeJSON(),
        access_token: accessToken,
        refresh_token: refreshToken
      }
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
    // Message temporairement verbose pour diagnostiquer
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      debug: err.message,
      code:  err.code || err.name
    });
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
    const payload = { id: user.id, role: user.role, club_id: user.club_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({
      refresh_token: refreshToken,
      derniere_connexion: new Date()
    });

    const redirectUrl = `${process.env.APP_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    return res.redirect(`${process.env.APP_URL}/login?error=oauth_failed`);
  }
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
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi', debug: err.message });
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
    return res.status(500).json({ success: false, message: 'Erreur serveur', debug: err.message });
  }
};

module.exports = { register, login, refresh, logout, googleCallback, me, forgotPassword, resetPassword };
