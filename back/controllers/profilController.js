const { User, Licencie, Convocation, Match, Equipe } = require('../models');
const { validationResult } = require('express-validator');

const getProfil = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'refresh_token', 'google_id'] },
      include: [{
        model: Licencie, as: 'licence',
        include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] }]
      }]
    });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone, date_naissance, notif_email, notif_push } = req.body;
    await req.user.update({ nom, prenom, telephone, date_naissance, notif_email, notif_push });
    return res.json({ success: true, data: req.user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { ancien_password, nouveau_password } = req.body;
    if (!ancien_password || !nouveau_password) {
      return res.status(400).json({ success: false, message: 'Paramètres manquants' });
    }

    const user = await User.findByPk(req.user.id);
    const valid = await user.verifyPassword(ancien_password);
    if (!valid) return res.status(400).json({ success: false, message: 'Ancien mot de passe incorrect' });

    await user.update({ password_hash: nouveau_password });
    return res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Fichier requis' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await req.user.update({ avatar: avatarUrl });
    return res.json({ success: true, data: { avatar: avatarUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getHistorique = async (req, res) => {
  try {
    const convocations = await Convocation.findAll({
      where: { joueur_id: req.user.id },
      include: [{
        model: Match, as: 'match',
        include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom'] }]
      }],
      order: [[{ model: Match, as: 'match' }, 'date', 'DESC']],
      limit: 30
    });
    return res.json({ success: true, data: convocations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getEnfants = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }
    const enfants = await User.findAll({
      where: { parent_id: req.user.id },
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      include: [{
        model: Licencie, as: 'licence',
        include: [{ model: Equipe, as: 'equipe' }]
      }]
    });
    return res.json({ success: true, data: enfants });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getProfil, updateProfil, updatePassword, uploadAvatar, getHistorique, getEnfants };
