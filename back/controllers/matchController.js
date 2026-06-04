const { Match, Equipe, Terrain, Convocation, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const where = {};
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
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] },
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
        { model: Equipe, as: 'equipe' },
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

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const match = await Match.create(req.body);
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
    await match.update({ statut: 'annule' });
    return res.json({ success: true, message: 'Match annulé' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, saisirScore, remove };
