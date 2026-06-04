const express = require('express');
const router = express.Router();
const { getResultatsLocaux, getClassementFFF, getResultatsFFF } = require('../controllers/resultatController');
const { optionalAuth, authenticate } = require('../middlewares/auth');
const { Match, Equipe, Licencie, User } = require('../models');
const { Op } = require('sequelize');

// Public — accessibles aux visiteurs
router.get('/', optionalAuth, getResultatsLocaux);
router.get('/fff/:competition_id/classement', optionalAuth, getClassementFFF);
router.get('/fff/:competition_id', optionalAuth, getResultatsFFF);

// Stats buteurs — top marqueurs du club
router.get('/stats/buteurs', authenticate, async (req, res) => {
  try {
    const licencies = await Licencie.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'avatar'] },
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] },
      ],
      where: { statut: 'actif' },
      order: [['created_at', 'ASC']],
      limit: 20,
    });
    const data = licencies.map(l => ({
      id: l.id,
      nom:     l.user?.nom    || '',
      prenom:  l.user?.prenom || '',
      equipe:  l.equipe?.nom  || '',
      buts:    0,
      assists: 0,
      matchs:  0,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Stats équipes — bilan par équipe
router.get('/stats/equipes', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user?.club_id) {
      const equipes = await Equipe.findAll({ where: { club_id: req.user.club_id, actif: true } });
      where.equipe_id = equipes.map(e => e.id);
    }

    const matchs = await Match.findAll({
      where: { ...where, statut: 'termine' },
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] }],
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
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
