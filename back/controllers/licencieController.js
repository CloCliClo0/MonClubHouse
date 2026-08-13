const { Licencie, User, Equipe, Category, Convocation, Match } = require('../models');

const getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.equipe_id) where.equipe_id = req.query.equipe_id;
    if (req.query.statut) where.statut = req.query.statut;

    // Filtre club (+ catégorie si fournie) via l'équipe (les licenciés n'ont pas de club_id direct)
    const equipeWhere = {};
    if (req.query.categorie_id) equipeWhere.categorie_id = req.query.categorie_id;
    if (req.user.role !== 'superadmin' && req.user.club_id) equipeWhere.club_id = req.user.club_id;
    const includeEquipe = {
      model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'],
      include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }],
      ...(Object.keys(equipeWhere).length ? { where: equipeWhere } : {}),
    };

    const licencies = await Licencie.findAll({
      where,
      include: [
        {
          model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'email', 'avatar', 'telephone', 'parent_id'],
          include: [{ model: User, as: 'parent', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'], required: false }]
        },
        includeEquipe,
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

const ALLOWED_CREATE = ['user_id', 'equipe_id', 'numero_licence', 'statut', 'poste', 'numero_maillot', 'pied_fort', 'date_expiration_licence'];
const ALLOWED_UPDATE = ['numero_licence', 'statut', 'poste', 'numero_maillot', 'pied_fort', 'date_expiration_licence'];

const create = async (req, res) => {
  try {
    const existing = await Licencie.findOne({ where: { user_id: req.body.user_id, equipe_id: req.body.equipe_id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Ce joueur est déjà dans cette équipe' });
    }
    const data = {};
    for (const key of ALLOWED_CREATE) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const licencie = await Licencie.create(data);

    // Auto-inscription dans les autres équipes de la même catégorie
    // (ex: catégorie Senior avec équipes A et B → rejoindre l'une rejoint l'autre)
    const autresEquipes = [];
    const equipe = await Equipe.findByPk(data.equipe_id, { attributes: ['id', 'club_id', 'categorie_id'] });
    if (equipe?.categorie_id) {
      const siblings = await Equipe.findAll({
        where: { categorie_id: equipe.categorie_id, club_id: equipe.club_id, actif: true },
        attributes: ['id'],
      });
      const siblingIds = siblings.map(s => s.id).filter(id => id !== equipe.id);
      if (siblingIds.length > 0) {
        const alreadyIn = await Licencie.findAll({
          where: { user_id: data.user_id, equipe_id: siblingIds },
          attributes: ['equipe_id'],
        });
        const alreadyInIds = new Set(alreadyIn.map(l => l.equipe_id));
        const toCreate = siblingIds.filter(id => !alreadyInIds.has(id));
        if (toCreate.length > 0) {
          const created = await Licencie.bulkCreate(toCreate.map(equipe_id => ({
            user_id: data.user_id,
            equipe_id,
            statut: data.statut || 'actif',
          })));
          autresEquipes.push(...created);
        }
      }
    }

    return res.status(201).json({ success: true, data: licencie, autres_equipes: autresEquipes.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const licencie = await Licencie.findByPk(req.params.id);
    if (!licencie) return res.status(404).json({ success: false, message: 'Licencié introuvable' });
    const updates = {};
    for (const key of ALLOWED_UPDATE) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await licencie.update(updates);
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
