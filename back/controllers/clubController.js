const { Club, Terrain, User, Equipe, Sport } = require('../models');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const where = req.user?.role === 'superadmin' ? {} : { actif: true };
    const clubs = await Club.findAll({
      where,
      attributes: ['id', 'nom', 'logo', 'ville', 'couleur_primaire', 'actif']
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

// GET /clubs/stats — stats du club de l'utilisateur
const getStats = async (req, res) => {
  try {
    const clubId = req.user?.club_id;
    const whereClub = clubId ? { club_id: clubId } : {};
    const { Op } = require('sequelize');
    const { Match, Notification } = require('../models');

    const [membres, equipes, matchs_weekend, notifications] = await Promise.all([
      User.count({ where: { ...whereClub, actif: true } }),
      Equipe.count({ where: { ...whereClub, actif: true } }),
      Match.count({ where: { date: { [Op.between]: [new Date(), new Date(Date.now() + 7 * 86400000)] }, statut: 'programme' } }),
      Notification.count({ where: { user_id: req.user.id, lu: false } }),
    ]);
    return res.json({ success: true, data: { membres, equipes, matchs_weekend, notifications } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /clubs/terrains — terrains du club de l'utilisateur
const getTerrains = async (req, res) => {
  try {
    const where = { actif: true };
    if (req.user?.club_id) where.club_id = req.user.club_id;
    const terrains = await Terrain.findAll({ where, order: [['nom', 'ASC']] });
    return res.json({ success: true, data: terrains });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /clubs/terrains — créer un terrain
const createTerrain = async (req, res) => {
  try {
    const club_id = req.body.club_id || req.user.club_id;
    if (!club_id) return res.status(400).json({ success: false, message: 'club_id requis' });
    const terrain = await Terrain.create({ ...req.body, club_id });
    return res.status(201).json({ success: true, data: terrain });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /clubs/terrains/:id — modifier un terrain
const updateTerrain = async (req, res) => {
  try {
    const terrain = await Terrain.findByPk(req.params.id);
    if (!terrain) return res.status(404).json({ success: false, message: 'Terrain introuvable' });
    await terrain.update(req.body);
    return res.json({ success: true, data: terrain });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /clubs/terrains/:id — supprimer (soft)
const deleteTerrain = async (req, res) => {
  try {
    const terrain = await Terrain.findByPk(req.params.id);
    if (!terrain) return res.status(404).json({ success: false, message: 'Terrain introuvable' });
    await terrain.update({ actif: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /clubs/:id — soft delete club (superadmin)
const deleteClub = async (req, res) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club introuvable' });
    await club.update({ actif: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, uploadLogo, getStats, getTerrains, createTerrain, updateTerrain, deleteTerrain, deleteClub };
