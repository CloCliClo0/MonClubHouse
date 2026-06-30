const { Match, Equipe, Terrain, Convocation, Composition, User, Category } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const where = { statut: { [Op.ne]: 'annule' } };
    // Filtre par club (sauf superadmin)
    if (req.user.role !== 'superadmin' && req.user.club_id) {
      where.club_id = req.user.club_id;
    }
    if (req.query.equipe_id) where.equipe_id = req.query.equipe_id;
    if (req.query.type) where.type = req.query.type;
    if (req.query.statut) where.statut = req.query.statut;

    if (req.query.month) {
      const [annee, mois] = req.query.month.split('-').map(Number);
      const debut = new Date(annee, mois - 1, 1);
      const fin   = new Date(annee, mois, 0, 23, 59, 59);
      where.date  = { [Op.between]: [debut, fin] };
    } else if (req.query.mois && req.query.annee) {
      const debut = new Date(req.query.annee, req.query.mois - 1, 1);
      const fin = new Date(req.query.annee, req.query.mois, 0, 23, 59, 59);
      where.date = { [Op.between]: [debut, fin] };
    }

    const matchs = await Match.findAll({
      where,
      include: [
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'],
          include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] },
        { model: Terrain, as: 'terrain', attributes: ['id', 'nom', 'adresse'], required: false }
      ],
      order: [['date', 'ASC']]
    });
    return res.json({ success: true, data: matchs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [
        { model: Equipe, as: 'equipe',
          include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] },
        { model: Terrain, as: 'terrain', required: false },
        {
          model: Convocation, as: 'convocations',
          include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'avatar'] }]
        }
      ]
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    return res.json({ success: true, data: match });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const TYPE_MAP = { plateau: 'autre', reunion: 'autre' };

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const rawType = req.body.type;
    const payload = {
      ...req.body,
      type: TYPE_MAP[rawType] ?? rawType,
      club_id: req.body.club_id ?? req.user.club_id,
    };
    const match = await Match.create(payload);
    return res.status(201).json({ success: true, data: match });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    await match.update(req.body);
    return res.json({ success: true, data: match });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const saisirScore = async (req, res) => {
  try {
    const { score_equipe, score_adversaire } = req.body;
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    await match.update({
      score_equipe,
      score_adversaire,
      statut: 'termine'
    });
    return res.json({ success: true, data: match });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    await Convocation.destroy({ where: { match_id: match.id } });
    await Composition.destroy({ where: { match_id: match.id } });
    await match.destroy();
    return res.json({ success: true, message: 'Événement supprimé' });
  } catch (err) {
    console.error('[matchController.remove]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /matchs/recurring — crée des entraînements récurrents (coach+)
const createRecurring = async (req, res) => {
  try {
    const { equipe_id, day_of_week, heure, heure_rdv, terrain_id, description, date_debut, date_fin } = req.body;
    if (!equipe_id || day_of_week === undefined || !heure || !date_debut || !date_fin) {
      return res.status(400).json({ success: false, message: 'equipe_id, day_of_week, heure, date_debut, date_fin requis' });
    }

    const equipe = await Equipe.findByPk(equipe_id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });

    const start = new Date(date_debut);
    const end = new Date(date_fin);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ success: false, message: 'Dates invalides' });
    }

    const created = [];
    const current = new Date(start);
    // Avancer au premier jour correspondant
    while (current.getDay() !== Number(day_of_week)) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= end) {
      const match = await Match.create({
        equipe_id, type: 'entrainement', statut: 'programme',
        date: current.toISOString().slice(0, 10),
        heure, heure_rdv: heure_rdv || null,
        terrain_id: terrain_id || null,
        description: description || null,
        club_id: equipe.club_id,
      });
      created.push(match);
      current.setDate(current.getDate() + 7);
    }

    return res.status(201).json({ success: true, data: created, count: created.length });
  } catch (err) {
    console.error('[match.createRecurring]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, saisirScore, remove, createRecurring };
