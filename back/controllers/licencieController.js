const { Licencie, User, Equipe, Category, Convocation, Match } = require('../models');

const getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.equipe_id) where.equipe_id = req.query.equipe_id;
    if (req.query.statut) where.statut = req.query.statut;

    const licencies = await Licencie.findAll({
      where,
      include: [
        {
          model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'email', 'avatar', 'telephone', 'parent_id'],
          include: [{ model: User, as: 'parent', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'], required: false }]
        },
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'],
          include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] }
      ]
    });
    return res.json({ success: true, data: licencies });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const licencie = await Licencie.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: Equipe, as: 'equipe' }
      ]
    });
    if (!licencie) return res.status(404).json({ success: false, message: 'Licencié introuvable' });
    return res.json({ success: true, data: licencie });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const existing = await Licencie.findOne({ where: { user_id: req.body.user_id, equipe_id: req.body.equipe_id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Ce joueur est déjà dans cette équipe' });
    }
    const licencie = await Licencie.create(req.body);
    return res.status(201).json({ success: true, data: licencie });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const licencie = await Licencie.findByPk(req.params.id);
    if (!licencie) return res.status(404).json({ success: false, message: 'Licencié introuvable' });
    await licencie.update(req.body);
    return res.json({ success: true, data: licencie });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const changerEquipe = async (req, res) => {
  try {
    const licencie = await Licencie.findByPk(req.params.id);
    if (!licencie) return res.status(404).json({ success: false, message: 'Licencié introuvable' });
    await licencie.update({ equipe_id: req.body.equipe_id });
    return res.json({ success: true, message: 'Équipe mise à jour', data: licencie });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /licencies/mes-convocations — convocations du joueur connecté ou de ses enfants (parent)
const mesConvocations = async (req, res) => {
  try {
    const matchInclude = {
      model: Match,
      as: 'match',
      attributes: ['id', 'date', 'heure', 'type', 'adversaire', 'lieu', 'statut'],
    };

    let convocations = [];

    if (req.user.role === 'joueur') {
      convocations = await Convocation.findAll({
        where: { joueur_id: req.user.id },
        include: [matchInclude],
        order: [[{ model: Match, as: 'match' }, 'date', 'ASC']],
      });
    } else if (req.user.role === 'parent') {
      const enfants = await User.findAll({
        where: { parent_id: req.user.id },
        attributes: ['id', 'nom', 'prenom'],
      });
      if (enfants.length > 0) {
        const enfantIds = enfants.map(e => e.id);
        convocations = await Convocation.findAll({
          where: { joueur_id: enfantIds },
          include: [
            matchInclude,
            { model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom'] },
          ],
          order: [[{ model: Match, as: 'match' }, 'date', 'ASC']],
        });
      }
    }

    return res.json({ success: true, data: convocations });
  } catch (err) {
    console.error('[licencie.mesConvocations]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, changerEquipe, mesConvocations };
