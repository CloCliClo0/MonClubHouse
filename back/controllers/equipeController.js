const { Equipe, Licencie, User, Sport, Match, EquipeCoach, Category } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const CATEGORY_INCLUDE = { model: Category, as: 'categorie', attributes: ['id', 'nom', 'couleur'], required: false };

const getAll = async (req, res) => {
  try {
    const where = { actif: true };
    if (req.query.club_id) where.club_id = req.query.club_id;
    if (req.query.sport_id) where.sport_id = req.query.sport_id;
    if (req.query.categorie_id) where.categorie_id = req.query.categorie_id;

    const role = req.user?.role;

    if (role === 'coach') {
      const coachLinks = await EquipeCoach.findAll({
        where: { user_id: req.user.id },
        attributes: ['equipe_id'],
        raw: true,
      });
      const linkedIds = coachLinks.map(l => l.equipe_id);
      if (linkedIds.length === 0) return res.json({ success: true, data: [] });

      // Expand to all equipes in the same categories as direct assignments
      const linkedEquipes = await Equipe.findAll({
        where: { id: { [Op.in]: linkedIds }, actif: true },
        attributes: ['id', 'categorie_id'],
        raw: true,
      });
      const categorieIds = [...new Set(linkedEquipes.map(e => e.categorie_id).filter(Boolean))];
      if (categorieIds.length > 0) {
        where.categorie_id = { [Op.in]: categorieIds };
      } else {
        where.id = { [Op.in]: linkedIds };
      }
    } else if (['joueur', 'parent'].includes(role)) {
      const licencies = await Licencie.findAll({
        where: { user_id: req.user.id },
        include: [{ model: Equipe, as: 'equipe', attributes: ['categorie_id'] }],
        raw: true,
        nest: true,
      });
      const categorieIds = [...new Set(licencies.map(l => l.equipe?.categorie_id).filter(Boolean))];
      if (categorieIds.length === 0) return res.json({ success: true, data: [] });
      where.categorie_id = { [Op.in]: categorieIds };
    }

    const equipes = await Equipe.findAll({
      where,
      include: [
        CATEGORY_INCLUDE,
        { model: Sport, as: 'sport', required: false },
        { model: User, as: 'coachs_extra', attributes: ['id', 'nom', 'prenom'], through: { attributes: [] }, required: false },
        { model: Licencie, as: 'licencies', where: { statut: 'actif' }, required: false, attributes: ['id'] },
      ],
    });
    const data = equipes.map(e => ({
      ...e.toJSON(),
      players_count: e.licencies ? e.licencies.length : 0,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[equipe.getAll]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id, {
      include: [
        CATEGORY_INCLUDE,
        { model: Sport, as: 'sport', required: false },
        {
          model: Licencie, as: 'licencies',
          include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar'] }]
        }
      ]
    });
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    return res.json({ success: true, data: equipe });
  } catch (err) {
    console.error('[equipe.getById]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const data = { ...req.body };
    if (!data.club_id && req.user.club_id) data.club_id = req.user.club_id;
    if (!data.sport_id) {
      const defaultSport = await Sport.findOne({ order: [['id', 'ASC']] });
      if (defaultSport) data.sport_id = defaultSport.id;
    }
    // categorie_id can be passed directly; ignore old categorie string
    delete data.categorie;

    const equipe = await Equipe.create(data);
    const withCat = await Equipe.findByPk(equipe.id, { include: [CATEGORY_INCLUDE] });
    return res.status(201).json({ success: true, data: withCat });
  } catch (err) {
    console.error('[equipe.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    const data = { ...req.body };
    delete data.categorie;
    await equipe.update(data);
    const withCat = await Equipe.findByPk(equipe.id, { include: [CATEGORY_INCLUDE] });
    return res.json({ success: true, data: withCat });
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

const addCoach = async (req, res) => {
  try {
    const equipe = await Equipe.findByPk(req.params.id);
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });
    await EquipeCoach.findOrCreate({ where: { equipe_id: equipe.id, user_id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('[equipe.addCoach]', err.message);
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

    return res.json({ success: true });
  } catch (err) {
    console.error('[equipe.updateCoachs]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getCategoriesCoach = async (req, res) => {
  try {
    const coachLinks = await EquipeCoach.findAll({ where: { user_id: req.user.id }, attributes: ['equipe_id'], raw: true });
    const linkedIds = coachLinks.map(l => l.equipe_id);
    if (linkedIds.length === 0) return res.json({ success: true, data: [] });

    const equipes = await Equipe.findAll({
      where: { actif: true, id: { [Op.in]: linkedIds } },
      include: [CATEGORY_INCLUDE],
    });
    const seen = new Set();
    const categories = [];
    for (const e of equipes) {
      if (e.categorie && !seen.has(e.categorie.id)) {
        seen.add(e.categorie.id);
        categories.push(e.categorie.toJSON());
      }
    }
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[equipe.getCategoriesCoach]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove, addCoach, updateCoachs, getCategoriesCoach };
