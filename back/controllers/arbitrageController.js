const { ArbitragePresence, User, Match } = require('../models');
const { Op } = require('sequelize');

// GET /arbitrage/presences?date=YYYY-MM-DD
const getPresences = async (req, res) => {
  try {
    const { date } = req.query;
    const club_id = req.user.club_id;
    const where = { club_id };
    if (date) where.date = date;

    const presences = await ArbitragePresence.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar', 'telephone', 'poste'] }],
      order: [['date', 'ASC'], ['created_at', 'ASC']],
    });

    // Regrouper par date
    const byDate = {};
    for (const p of presences) {
      if (!byDate[p.date]) byDate[p.date] = [];
      byDate[p.date].push(p);
    }

    return res.json({ success: true, data: date ? presences : byDate });
  } catch (err) {
    console.error('[arbitrage.getPresences]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /arbitrage/mes-presences
const getMesPresences = async (req, res) => {
  try {
    const presences = await ArbitragePresence.findAll({
      where: { club_id: req.user.club_id, user_id: req.user.id },
      order: [['date', 'ASC']],
    });
    return res.json({ success: true, data: presences });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /arbitrage/presences
const addPresence = async (req, res) => {
  try {
    const { date, commentaire } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date requise' });

    // Compter les présences sur cette date (max 2 par défaut, configurable)
    const count = await ArbitragePresence.count({ where: { club_id: req.user.club_id, date } });
    if (count >= 2) {
      return res.status(409).json({ success: false, message: 'Quota atteint pour cette date (max 2 arbitres)' });
    }

    const presence = await ArbitragePresence.create({
      club_id: req.user.club_id, user_id: req.user.id, date, commentaire: commentaire ?? null,
    });
    return res.status(201).json({ success: true, data: presence });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Vous êtes déjà inscrit pour cette date' });
    }
    console.error('[arbitrage.addPresence]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /arbitrage/presences/:id
const deletePresence = async (req, res) => {
  try {
    const p = await ArbitragePresence.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!p) return res.status(404).json({ success: false, message: 'Inscription introuvable' });
    // Seul le propriétaire ou admin+ peut supprimer
    if (p.user_id !== req.user.id && !['admin', 'superadmin', 'dirigeant'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Droits insuffisants' });
    }
    await p.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /arbitrage/stats
const getStats = async (req, res) => {
  try {
    const presences = await ArbitragePresence.findAll({
      where: { club_id: req.user.club_id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
    });
    // Compter par utilisateur
    const byUser = {};
    for (const p of presences) {
      const id = p.user_id;
      if (!byUser[id]) byUser[id] = { user: p.user, count: 0, dates: [] };
      byUser[id].count++;
      byUser[id].dates.push(p.date);
    }
    const stats = Object.values(byUser).sort((a, b) => b.count - a.count);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getPresences, getMesPresences, addPresence, deletePresence, getStats };
