const express = require('express');
const router = express.Router();
const { getResultatsLocaux, getClassementFFF, getResultatsFFF, getAttendanceStats } = require('../controllers/resultatController');
const { optionalAuth, authenticate } = require('../middlewares/auth');
const { Match, Equipe, Licencie, User, MatchEvent } = require('../models');
const { Op } = require('sequelize');

// Public — accessibles aux visiteurs
router.get('/', optionalAuth, getResultatsLocaux);
router.get('/fff/:competition_id/classement', optionalAuth, getClassementFFF);
router.get('/fff/:competition_id', optionalAuth, getResultatsFFF);

// Stats buteurs — top marqueurs calculés depuis les MatchEvents réels
router.get('/stats/buteurs', authenticate, async (req, res) => {
  try {
    const whereClub = req.user.club_id ? { club_id: req.user.club_id } : {};

    // Récupère tous les events "but" du club
    const buts = await MatchEvent.findAll({
      where: { ...whereClub, type: 'but', joueur_id: { [Op.ne]: null } },
      attributes: ['joueur_id', 'passeur_id'],
    });

    // Agrège buts et assists par joueur
    const statsMap = {};
    for (const b of buts) {
      if (b.joueur_id) {
        if (!statsMap[b.joueur_id]) statsMap[b.joueur_id] = { buts: 0, assists: 0 };
        statsMap[b.joueur_id].buts++;
      }
      if (b.passeur_id) {
        if (!statsMap[b.passeur_id]) statsMap[b.passeur_id] = { buts: 0, assists: 0 };
        statsMap[b.passeur_id].assists++;
      }
    }

    const userIds = Object.keys(statsMap).map(Number);
    if (userIds.length === 0) return res.json({ success: true, data: [] });

    // Récupère les infos joueurs + équipe via Licencie
    const licencies = await Licencie.findAll({
      where: { user_id: userIds, statut: 'actif' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar'] },
        {
          model: Equipe, as: 'equipe', attributes: ['id', 'nom'],
          include: [{ model: require('../models').Category, as: 'categorie', attributes: ['nom'], required: false }]
        },
      ],
    });

    // Compte les matchs joués (convoqués et présents)
    const { Convocation } = require('../models');
    const convocations = await Convocation.findAll({
      where: { joueur_id: userIds, statut: 'present' },
      attributes: ['joueur_id'],
    });
    const matchsMap = {};
    for (const c of convocations) {
      matchsMap[c.joueur_id] = (matchsMap[c.joueur_id] || 0) + 1;
    }

    // Déduplique par user_id (garde la première licence trouvée)
    const seenUsers = new Set();
    const data = [];
    for (const l of licencies) {
      if (!l.user || seenUsers.has(l.user_id)) continue;
      seenUsers.add(l.user_id);
      const s = statsMap[l.user_id] || { buts: 0, assists: 0 };
      data.push({
        id:      l.user_id,
        nom:     l.user.nom    || '',
        prenom:  l.user.prenom || '',
        avatar:  l.user.avatar || null,
        equipe:  l.equipe?.nom || '',
        categorie: l.equipe?.categorie?.nom || '',
        buts:    s.buts,
        assists: s.assists,
        matchs:  matchsMap[l.user_id] || 0,
      });
    }

    // Tri par buts décroissants
    data.sort((a, b) => b.buts - a.buts || b.assists - a.assists);

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[stats/buteurs]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Stats équipes — bilan par équipe (victoires, nuls, défaites, buts)
router.get('/stats/equipes', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user?.club_id) {
      const equipes = await Equipe.findAll({ where: { club_id: req.user.club_id, actif: true }, attributes: ['id'] });
      where.equipe_id = { [Op.in]: equipes.map(e => e.id) };
    }

    const matchs = await Match.findAll({
      where: { ...where, statut: 'termine' },
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom'] }],
    });

    const byEquipe = {};
    matchs.forEach(m => {
      const eq = m.equipe;
      if (!eq) return;
      if (!byEquipe[eq.id]) {
        byEquipe[eq.id] = { equipe: eq.nom, matchs: 0, victoires: 0, nuls: 0, defaites: 0, bp: 0, bc: 0 };
      }
      const s = byEquipe[eq.id];
      s.matchs++;
      const gs = m.score_equipe ?? 0, ga = m.score_adversaire ?? 0;
      s.bp += gs; s.bc += ga;
      if (gs > ga) s.victoires++;
      else if (gs === ga) s.nuls++;
      else s.defaites++;
    });

    return res.json({ success: true, data: Object.values(byEquipe) });
  } catch (err) {
    console.error('[stats/equipes]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Stats présence par joueur
router.get('/stats/presence', authenticate, getAttendanceStats);

module.exports = router;
