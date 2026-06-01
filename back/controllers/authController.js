const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { validationResult } = require('express-validator');

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

module.exports = { register, login, refresh, logout, googleCallback, me };
