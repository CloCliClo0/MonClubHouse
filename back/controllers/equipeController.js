const { Equipe, Licencie, User, Sport, Match, EquipeCoach } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const where = { actif: true };
    if (req.query.club_id) where.club_id = req.query.club_id;
    if (req.query.sport_id) where.sport_id = req.query.sport_id;
    if (req.query.categorie) where.categorie = req.query.categorie;

    const role = req.user?.role;

    if (role === 'coach') {
      const coachLinks = await EquipeCoach.findAll({
        where: { user_id: req.user.id },
        attributes: ['equipe_id'],
        raw: true,
      });
      const linkedIds = coachLinks.map(l => l.equipe_id);
      const orClauses = [{ coach_id: req.user.id }];
      if (linkedIds.length > 0) orClauses.push({ id: { [Op.in]: linkedIds } });
      where[Op.or] = orClauses;
    } else if (['joueur', 'parent'].includes(role)) {
      const licencies = await Licencie.findAll({
        where: { user_id: req.user.id },
        include: [{ model: Equipe, as: 'equipe', attributes: ['categorie'] }],
        raw: true,
        nest: true,
      });
      const categories = [...new Set(licencies.map(l => l.equipe?.categorie).filter(Boolean))];
      if (categories.length === 0) return res.json({ success: true, data: [] });
      where.categorie = { [Op.in]: categories };
    }

    const equipes = await Equipe.findAll({
      where,
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'coach', attributes: ['id', 'nom', 'prenom'], required: false },
        { model: User, as: 'coachs_extra', attributes: ['id', 'nom', 'prenom'], through: { attributes: [] }, required: false },
      ],
    });
    return res.json({ success: true, data: equipes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id, {
      include: [
        { model: Sport, as: 'sport' },
        {
          model: Licencie, as: 'licencies',
          include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar'] }]
        }
      ]
    });
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    return res.json({ success: true, data: equipe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const data = { ...req.body };
    // Injecter club_id depuis l'utilisateur si non fourni
    if (!data.club_id && req.user.club_id) data.club_id = req.user.club_id;
    // Résoudre sport_id : prendre le premier sport disponible si absent
    if (!data.sport_id) {
      const defaultSport = await Sport.findOne({ order: [['id', 'ASC']] });
      if (!defaultSport) return res.status(400).json({ success: false, message: 'Aucun sport configuré — ajoutez-en un d\'abord.' });
      data.sport_id = defaultSport.id;
    }

    const equipe = await Equipe.create(data);
    return res.status(201).json({ success: true, data: equipe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    await equipe.update(req.body);
    return res.json({ success: true, data: equipe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    await equipe.update({ actif: false });
    return res.json({ success: true, message: 'Équipe désactivée' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateCoachs = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });

    const { coach_ids } = req.body;
    if (!Array.isArray(coach_ids)) return res.status(400).json({ success: false, message: 'coach_ids doit être un tableau' });

    await EquipeCoach.destroy({ where: { equipe_id: equipe.id } });
    if (coach_ids.length > 0) {
      await EquipeCoach.bulkCreate(coach_ids.map(uid => ({ equipe_id: equipe.id, user_id: uid })));
    }
    await equipe.update({ coach_id: coach_ids[0] || null });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove, updateCoachs };
