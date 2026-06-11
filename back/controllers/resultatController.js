const axios = require('axios');
const { Match, Equipe, Convocation, User, Licencie } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const getResultatsLocaux = async (req, res) => {
  try {
    const where = { statut: 'termine' };
    if (req.query.equipe_id) where.equipe_id = req.query.equipe_id;
    if (req.query.club_id) {
      const equipes = await Equipe.findAll({ where: { club_id: req.query.club_id, actif: true } });
      where.equipe_id = equipes.map(e => e.id);
    }

    const matchs = await Match.findAll({
      where,
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] }],
      order: [['date', 'DESC']],
      limit: parseInt(req.query.limit) || 20
    });

    return res.json({ success: true, data: matchs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getClassementFFF = async (req, res) => {
  try {
    const { competition_id } = req.params;
    if (!process.env.FFF_API_KEY) {
      return res.status(503).json({ success: false, message: 'API FFF non configurée' });
    }

    const response = await axios.get(
      `${process.env.FFF_API_URL}/competitions/${competition_id}/classement`,
      {
        headers: { 'X-API-KEY': process.env.FFF_API_KEY },
        timeout: 10000
      }
    );
    return res.json({ success: true, source: 'fff', data: response.data });
  } catch (err) {
    console.error('FFF API error:', err.message);
    return res.status(502).json({ success: false, message: 'Erreur API FFF' });
  }
};

const getResultatsFFF = async (req, res) => {
  try {
    const { competition_id } = req.params;
    if (!process.env.FFF_API_KEY) {
      return res.status(503).json({ success: false, message: 'API FFF non configurée' });
    }

    const response = await axios.get(
      `${process.env.FFF_API_URL}/competitions/${competition_id}/resultats`,
      {
        params: { journee: req.query.journee },
        headers: { 'X-API-KEY': process.env.FFF_API_KEY },
        timeout: 10000
      }
    );
    return res.json({ success: true, source: 'fff', data: response.data });
  } catch (err) {
    return res.status(502).json({ success: false, message: 'Erreur API FFF' });
  }
};

// GET /resultats/stats/presence?equipe_id=X&saison=2024-2025
const getAttendanceStats = async (req, res) => {
  try {
    const { equipe_id, saison } = req.query;
    const club_id = req.user.club_id;

    // Trouver les matchs concernés
    const matchWhere = { club_id };
    if (equipe_id) matchWhere.equipe_id = equipe_id;
    if (saison) matchWhere.saison = saison;

    const matchs = await Match.findAll({ where: matchWhere, attributes: ['id', 'type', 'date', 'adversaire'] });
    const matchIds = matchs.map(m => m.id);
    const matchsMatchs = matchs.filter(m => m.type === 'match');
    const matchsEntrainements = matchs.filter(m => m.type !== 'match');

    if (matchIds.length === 0) return res.json({ success: true, data: [] });

    // Toutes les convocations
    const convocations = await Convocation.findAll({
      where: { match_id: matchIds },
      include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
    });

    // Agréger par joueur
    const byJoueur = {};
    for (const c of convocations) {
      if (!c.joueur) continue;
      const id = c.joueur_id;
      if (!byJoueur[id]) {
        byJoueur[id] = { user: c.joueur, matchs: { convoques: 0, presents: 0, absents: 0 }, entrainements: { convoques: 0, presents: 0, absents: 0 } };
      }
      const isMatch = matchsMatchs.find(m => m.id === c.match_id);
      const cat = isMatch ? 'matchs' : 'entrainements';
      byJoueur[id][cat].convoques++;
      if (c.statut === 'present') byJoueur[id][cat].presents++;
      if (c.statut === 'absent') byJoueur[id][cat].absents++;
    }

    const stats = Object.values(byJoueur).map(s => ({
      user: s.user,
      matchs: { ...s.matchs, taux: s.matchs.convoques > 0 ? Math.round(s.matchs.presents / s.matchs.convoques * 100) : null },
      entrainements: { ...s.entrainements, taux: s.entrainements.convoques > 0 ? Math.round(s.entrainements.presents / s.entrainements.convoques * 100) : null },
    }));

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[resultat.getAttendanceStats]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getResultatsLocaux, getClassementFFF, getResultatsFFF, getAttendanceStats };
