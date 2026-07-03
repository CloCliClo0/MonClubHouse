const { User, Licencie, Convocation, Match, Equipe, Category } = require('../models');
const { validationResult } = require('express-validator');

const getProfil = async (req, res) => {
  try {
    const [user, meta] = await Promise.all([
      User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash', 'refresh_token', 'google_id'] },
        include: [{
          model: Licencie, as: 'licence',
          include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'],
            include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] }]
        }]
      }),
      User.findByPk(req.user.id, { attributes: ['google_id', 'password_hash'] }),
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    return res.json({
      success: true,
      data: { ...user.toJSON(), has_google: !!meta?.google_id, has_password: !!meta?.password_hash },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone, date_naissance, notif_email, notif_push, poste, pied_fort, taille, avatar } = req.body;
    const updates = { nom, prenom, telephone, date_naissance, notif_email, notif_push, poste, pied_fort };
    if (taille !== undefined) updates.taille = taille ? parseInt(taille) : null;
    if (avatar !== undefined) updates.avatar = avatar;
    await req.user.update(updates);
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
    const avatarUrl = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
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

// DELETE /profil/google-unlink
const unlinkGoogle = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'google_id', 'password_hash'] });
    if (!user?.google_id) {
      return res.status(400).json({ success: false, message: 'Aucun compte Google lié.' });
    }
    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: 'Définissez d\'abord un mot de passe avant de délier votre compte Google.' });
    }
    await User.update({ google_id: null }, { where: { id: req.user.id } });
    return res.json({ success: true, message: 'Compte Google délié.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /profil/set-initial-password — uniquement pour comptes sans mot de passe (ex: Google)
const setInitialPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'password_hash'] });
    if (user?.password_hash) {
      return res.status(400).json({ success: false, message: 'Utilisez "Changer le mot de passe" car vous en avez déjà un.' });
    }
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Mot de passe trop court (8 caractères min.)' });
    }
    await User.update({ password_hash: password }, { where: { id: req.user.id } });
    return res.json({ success: true, message: 'Mot de passe défini.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getProfil, updateProfil, updatePassword, uploadAvatar, getHistorique, getEnfants, unlinkGoogle, setInitialPassword };
