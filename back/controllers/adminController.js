const { User, Club, Equipe, Match, Notification } = require('../models');
const { Op } = require('sequelize');

const getDashboard = async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const whereClub = clubId ? { club_id: clubId } : {};

    const [totalUsers, totalEquipes, matchsAVenir, notifNonLues] = await Promise.all([
      User.count({ where: { ...whereClub, actif: true } }),
      Equipe.count({ where: { ...whereClub, actif: true } }),
      Match.count({
        where: {
          ...(clubId ? {} : {}),
          date: { [Op.gte]: new Date() },
          statut: 'programme'
        }
      }),
      Notification.count({ where: { user_id: req.user.id, lu: false } })
    ]);

    return res.json({
      success: true,
      data: { total_users: totalUsers, total_equipes: totalEquipes, matchs_a_venir: matchsAVenir, notif_non_lues: notifNonLues }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getUsers = async (req, res) => {
  try {
    const where = {};
    if (req.query.club_id) where.club_id = req.query.club_id;
    else if (req.user.club_id && req.user.role !== 'superadmin') where.club_id = req.user.club_id;
    if (req.query.role) where.role = req.query.role;
    if (req.query.actif !== undefined) where.actif = req.query.actif === 'true';

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash', 'refresh_token', 'google_id'] },
      order: [['nom', 'ASC']]
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const { role } = req.body;
    const rolesValides = ['admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur'];
    if (req.user.role !== 'superadmin') rolesValides.splice(0, 1);
    if (!rolesValides.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide' });
    }

    await user.update({ role });
    return res.json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const toggleUserActif = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    await user.update({ actif: !user.actif });
    return res.json({ success: true, data: { actif: user.actif } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const { nom, prenom, role, club_id } = req.body;
    const updates = {};
    if (nom    !== undefined) updates.nom    = nom;
    if (prenom !== undefined) updates.prenom = prenom;
    if (role   !== undefined) {
      const allowed = ['dirigeant', 'coach', 'joueur', 'parent', 'visiteur'];
      if (req.user.role === 'superadmin') allowed.push('superadmin', 'admin');
      if (allowed.includes(role)) updates.role = role;
    }
    // Seul le superadmin peut changer le club d'un utilisateur
    if (club_id !== undefined && req.user.role === 'superadmin') {
      updates.club_id = club_id || null;
    }

    await user.update(updates);
    return res.json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getDashboard, getUsers, updateUser, updateUserRole, toggleUserActif };
