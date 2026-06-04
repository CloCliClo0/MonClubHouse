const { InviteCode, Equipe, Club, User, Licencie } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Génère un code lisible ex: MCH-U15-A3F2
const makeCode = (prefix = 'MCH') =>
  `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// GET /api/codes — liste les codes (tous les clubs pour superadmin)
const listCodes = async (req, res) => {
  try {
    const where = {};
    // superadmin voit tous les codes ; sinon filtre par club
    if (req.user.role !== 'superadmin' && req.user.club_id) {
      where.club_id = req.user.club_id;
    }
    if (req.query.club_id) where.club_id = req.query.club_id;

    const codes = await InviteCode.findAll({
      where,
      include: [
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] },
        { model: Club,   as: 'club',   attributes: ['id', 'nom'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: codes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes — créer un code (admin)
const createCode = async (req, res) => {
  try {
    const { equipe_id, role = 'joueur', label, max_uses = 50, expires_at } = req.body;
    if (!equipe_id) return res.status(400).json({ success: false, message: 'equipe_id requis' });

    const equipe = await Equipe.findOne({ where: { id: equipe_id, club_id: req.user.club_id } });
    if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });

    const prefix = equipe.categorie?.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'MCH';
    let code, exists = true;
    while (exists) {
      code = makeCode(prefix);
      exists = await InviteCode.findOne({ where: { code } });
    }

    const newCode = await InviteCode.create({
      code,
      equipe_id,
      club_id: req.user.club_id,
      role,
      label,
      created_by: req.user.id,
      max_uses,
      expires_at: expires_at || null,
    });

    return res.status(201).json({ success: true, data: newCode });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/codes/:id — désactiver un code
const deleteCode = async (req, res) => {
  try {
    const code = await InviteCode.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!code) return res.status(404).json({ success: false, message: 'Code introuvable' });
    await code.update({ actif: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/validate — valide un code et lie l'utilisateur à l'équipe
const validateCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code requis' });

    const inviteCode = await InviteCode.findOne({
      where: {
        code: code.toUpperCase().trim(),
        actif: true,
        [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
      },
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] }],
    });

    if (!inviteCode) return res.status(404).json({ success: false, message: 'Code invalide ou expiré' });
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return res.status(410).json({ success: false, message: 'Ce code a atteint sa limite d\'utilisation' });
    }

    // Mise à jour du rôle et du club de l'utilisateur
    await req.user.update({
      role:    inviteCode.role,
      club_id: inviteCode.club_id,
    });

    // Création du licencié si joueur
    if (inviteCode.role === 'joueur') {
      await Licencie.findOrCreate({
        where: { user_id: req.user.id },
        defaults: {
          user_id:   req.user.id,
          equipe_id: inviteCode.equipe_id,
          nom:       req.user.nom,
          prenom:    req.user.prenom,
          statut:    'actif',
        },
      });
    }

    // Incrément du compteur
    await inviteCode.increment('uses_count');

    return res.json({
      success: true,
      message: `Vous avez rejoint ${inviteCode.equipe.nom} en tant que ${inviteCode.role}`,
      data: {
        equipe:  inviteCode.equipe,
        role:    inviteCode.role,
        club_id: inviteCode.club_id,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/link-child — lie un parent à son enfant (joueur)
const linkChild = async (req, res) => {
  try {
    const { child_user_id } = req.body;
    if (!child_user_id) return res.status(400).json({ success: false, message: 'child_user_id requis' });
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }

    const child = await User.findOne({ where: { id: child_user_id, club_id: req.user.club_id, role: 'joueur' } });
    if (!child) return res.status(404).json({ success: false, message: 'Joueur introuvable dans votre club' });

    // L'enfant pointe vers le parent via parent_id
    await child.update({ parent_id: req.user.id });

    return res.json({ success: true, message: `${child.prenom} ${child.nom} est maintenant lié à votre compte` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/codes/my-children — liste les enfants du parent connecté
const myChildren = async (req, res) => {
  try {
    if (req.user.role !== 'parent' && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }
    const children = await User.findAll({
      where: { parent_id: req.user.id },
      attributes: ['id', 'nom', 'prenom', 'avatar', 'club_id'],
      include: [{ model: Licencie, as: 'licence', attributes: ['equipe_id', 'statut'] }],
    });
    return res.json({ success: true, data: children });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/codes/club-players — joueurs du club non encore rattachés (pour choix enfant)
const clubPlayers = async (req, res) => {
  try {
    const players = await User.findAll({
      where: { club_id: req.user.club_id, role: 'joueur' },
      attributes: ['id', 'nom', 'prenom', 'avatar'],
      include: [{ model: Licencie, as: 'licence', attributes: ['equipe_id'] }],
    });
    return res.json({ success: true, data: players });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listCodes, createCode, deleteCode, validateCode, linkChild, myChildren, clubPlayers };
