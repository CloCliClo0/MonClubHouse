const { Club, Terrain, User, Equipe, Sport } = require('../models');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const clubs = await Club.findAll({
      where: { actif: true },
      attributes: ['id', 'nom', 'logo', 'ville', 'couleur_primaire']
    });
    return res.json({ success: true, data: clubs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const club = await Club.findByPk(req.params.id, {
      include: [
        { model: Terrain, as: 'terrains', where: { actif: true }, required: false },
        { model: Equipe, as: 'equipes', where: { actif: true }, required: false,
          include: [{ model: Sport, as: 'sport' }]
        }
      ]
    });
    if (!club) return res.status(404).json({ success: false, message: 'Club introuvable' });
    return res.json({ success: true, data: club });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const club = await Club.create(req.body);
    if (req.user.role !== 'superadmin') {
      await req.user.update({ club_id: club.id, role: 'admin' });
    }
    return res.status(201).json({ success: true, data: club });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club introuvable' });
    await club.update(req.body);
    return res.json({ success: true, data: club });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Fichier requis' });
    const club = await Club.findByPk(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club introuvable' });
    const logoUrl = `/uploads/${req.file.filename}`;
    await club.update({ logo: logoUrl });
    return res.json({ success: true, data: { logo: logoUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, uploadLogo };
