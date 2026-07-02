const { ArbitragePresence, User, Match, Licencie, EquipeCoach } = require('../models');
const { Op } = require('sequelize');

function calcAge(dateNaissance) {
  if (!dateNaissance) return null;
  const dob = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// Retourne les equipe_ids du coach (via table equipe_coachs uniquement — pas de coach_id direct sur Equipe)
async function getCoachEquipeIds(userId) {
  const rows = await EquipeCoach.findAll({ where: { user_id: userId }, attributes: ['equipe_id'] });
  return [...new Set(rows.map(r => r.equipe_id))];
}

// GET /arbitrage/presences?date=YYYY-MM-DD
const getPresences = async (req, res) => {
  try {
    const { date } = req.query;
    const club_id = req.user.club_id;
    const include = [
      { model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar', 'telephone', 'poste'] },
    ];

    let where = { club_id };
    if (date) where.date = date;

    if (req.user.role === 'coach') {
      // Coach : seulement ses matchs + matchs où ses joueurs sont inscrits
      const equipeIds = await getCoachEquipeIds(req.user.id);

      const [coachMatches, licencies] = await Promise.all([
        Match.findAll({ where: { equipe_id: { [Op.in]: equipeIds }, club_id }, attributes: ['id'] }),
        Licencie.findAll({ where: { equipe_id: { [Op.in]: equipeIds } }, attributes: ['user_id'] }),
      ]);

      const matchIds   = coachMatches.map(m => m.id);
      const joueurIds  = licencies.map(l => l.user_id);

      const orClauses = [];
      if (matchIds.length)  orClauses.push({ match_id: { [Op.in]: matchIds } });
      if (joueurIds.length) orClauses.push({ user_id:  { [Op.in]: joueurIds } });

      if (orClauses.length === 0) {
        return res.json({ success: true, data: date ? [] : {} });
      }
      where[Op.or] = orClauses;
    }

    const presences = await ArbitragePresence.findAll({
      where,
      include,
      order: [['date', 'ASC'], ['created_at', 'ASC']],
    });

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

// GET /arbitrage/matchs-besoin-arbitre
const getMatchsBesoinArbitre = async (req, res) => {
  try {
    const club_id = req.user.club_id;
    const where = {
      besoin_arbitre: true,
      statut: { [Op.in]: ['programme', 'en_cours'] },
      date: { [Op.gte]: new Date() },
    };
    if (club_id) where.club_id = club_id;

    // Coach : uniquement ses propres matchs
    if (req.user.role === 'coach') {
      const equipeIds = await getCoachEquipeIds(req.user.id);
      where.equipe_id = { [Op.in]: equipeIds.length ? equipeIds : [0] };
    }

    const matchs = await Match.findAll({
      where,
      include: [
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'] },
        {
          model: ArbitragePresence, as: 'arbitrage_presences',
          include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar', 'telephone'] }],
          required: false,
        },
      ],
      order: [['date', 'ASC']],
    });

    return res.json({ success: true, data: matchs });
  } catch (err) {
    console.error('[arbitrage.getMatchsBesoinArbitre]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /arbitrage/presences
const addPresence = async (req, res) => {
  try {
    // Vérification majorité
    const age = calcAge(req.user.date_naissance);
    if (age === null) {
      return res.status(400).json({ success: false, message: 'Votre date de naissance doit être renseignée dans votre profil pour vous inscrire comme arbitre.' });
    }
    if (age < 18) {
      return res.status(403).json({ success: false, message: 'Vous devez être majeur (18 ans révolus) pour vous inscrire comme arbitre.' });
    }

    const { date, match_id, commentaire } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date requise' });

    // Si match_id fourni, vérifier que le match appartient au club
    if (match_id) {
      const match = await Match.findOne({ where: { id: match_id, ...(req.user.club_id ? { club_id: req.user.club_id } : {}) } });
      if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    }

    // Max 2 arbitres par date
    const count = await ArbitragePresence.count({ where: { club_id: req.user.club_id, date } });
    if (count >= 2) {
      return res.status(409).json({ success: false, message: 'Quota atteint pour cette date (max 2 arbitres)' });
    }

    const presence = await ArbitragePresence.create({
      club_id: req.user.club_id,
      user_id: req.user.id,
      match_id: match_id ?? null,
      date,
      commentaire: commentaire ?? null,
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

module.exports = { getPresences, getMesPresences, getMatchsBesoinArbitre, addPresence, deletePresence, getStats };
