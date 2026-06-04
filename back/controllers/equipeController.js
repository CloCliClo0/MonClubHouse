const { Equipe, Licencie, User, Sport, Match } = require('../models');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const where = { actif: true };
    if (req.query.club_id) where.club_id = req.query.club_id;
    if (req.query.sport_id) where.sport_id = req.query.sport_id;
    if (req.query.categorie) where.categorie = req.query.categorie;

    const equipes = await Equipe.findAll({
      where,
      include: [{ model: Sport, as: 'sport' }]
    });
    return res.json({ success: true, data: equipes });
  } catch (err) {
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

module.exports = { getAll, getById, create, update, remove };
