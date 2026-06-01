const axios = require('axios');
const { Match, Equipe } = require('../models');
require('dotenv').config();

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

module.exports = { getResultatsLocaux, getClassementFFF, getResultatsFFF };
