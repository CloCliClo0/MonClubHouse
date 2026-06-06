const { ChEquipe, ChMatch } = require('../models');
const { Op } = require('sequelize');

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStandings(chEquipes, chMatchs) {
  return chEquipes
    .map(eq => {
      let J = 0, V = 0, N = 0, D = 0, BP = 0, BC = 0;
      chMatchs.forEach(m => {
        if (m.score_dom === null || m.score_ext === null) return;
        if (m.dom_id === eq.id) {
          J++; BP += m.score_dom; BC += m.score_ext;
          if (m.score_dom > m.score_ext) V++;
          else if (m.score_dom === m.score_ext) N++;
          else D++;
        } else if (m.ext_id === eq.id) {
          J++; BP += m.score_ext; BC += m.score_dom;
          if (m.score_ext > m.score_dom) V++;
          else if (m.score_ext === m.score_dom) N++;
          else D++;
        }
      });
      return { id: eq.id, nom: eq.nom, equipe_id: eq.equipe_id, couleur: eq.couleur,
               J, V, N, D, BP, BC, Diff: BP - BC, Pts: V * 3 + N };
    })
    .sort((a, b) => b.Pts - a.Pts || (b.Diff - a.Diff) || (b.BP - a.BP));
}

// ── Contrôleurs ───────────────────────────────────────────────────────────────

// GET /championnat/list?equipe_ref_id=X&saison=Y
const getChampionnats = async (req, res) => {
  try {
    const { equipe_ref_id, saison } = req.query;
    const club_id = req.user.club_id;
    if (!equipe_ref_id || !saison) return res.json({ success: true, data: [] });

    const rows = await ChEquipe.findAll({
      where: { club_id, equipe_ref_id, saison },
      attributes: ['championnat'],
      group: ['championnat'],
      raw: true,
    });
    const list = [...new Set(rows.map(r => r.championnat || '').filter(Boolean))];
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /championnat?equipe_ref_id=X&saison=Y&championnat=Z
const getClassement = async (req, res) => {
  try {
    const { equipe_ref_id, saison, championnat } = req.query;
    const club_id = req.user.club_id;
    if (!equipe_ref_id || !saison) {
      return res.json({ success: true, data: { equipes: [], matchs: [] } });
    }

    const where = { club_id, equipe_ref_id, saison };
    if (championnat) where.championnat = championnat;

    const chEquipes = await ChEquipe.findAll({ where, order: [['nom', 'ASC']], raw: true });
    const chMatchs  = await ChMatch.findAll({ where, order: [['journee', 'ASC'], ['date', 'ASC']], raw: true });

    const standings = computeStandings(chEquipes, chMatchs);
    return res.json({ success: true, data: { equipes: standings, matchs: chMatchs } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /championnat/equipes — ajouter une équipe au championnat
const addEquipe = async (req, res) => {
  try {
    const { equipe_ref_id, equipe_id, nom, saison, championnat, couleur } = req.body;
    const club_id = req.user.club_id;
    if (!equipe_ref_id || !nom || !saison) {
      return res.status(400).json({ success: false, message: 'equipe_ref_id, nom et saison sont requis' });
    }

    const eq = await ChEquipe.create({
      club_id, equipe_ref_id,
      equipe_id: equipe_id || null,
      nom: nom.trim(),
      saison, championnat: championnat || null,
      couleur: couleur || '#1b4332',
    });
    return res.status(201).json({ success: true, data: eq });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /championnat/equipes/:id
const updateEquipe = async (req, res) => {
  try {
    const eq = await ChEquipe.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    await eq.update(req.body);
    return res.json({ success: true, data: eq });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /championnat/equipes/:id
const removeEquipe = async (req, res) => {
  try {
    const eq = await ChEquipe.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    await ChMatch.destroy({
      where: { club_id: req.user.club_id, [Op.or]: [{ dom_id: eq.id }, { ext_id: eq.id }] },
    });
    await eq.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /championnat/matchs
const addMatch = async (req, res) => {
  try {
    const { equipe_ref_id, dom_id, ext_id, journee, date, score_dom, score_ext, saison, championnat } = req.body;
    const club_id = req.user.club_id;
    if (!equipe_ref_id || !dom_id || !ext_id || !saison) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    const m = await ChMatch.create({
      club_id, equipe_ref_id, dom_id, ext_id,
      journee: journee || null,
      date: date || null,
      score_dom: score_dom !== undefined && score_dom !== '' ? Number(score_dom) : null,
      score_ext: score_ext !== undefined && score_ext !== '' ? Number(score_ext) : null,
      saison, championnat: championnat || null,
    });
    return res.status(201).json({ success: true, data: m });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /championnat/matchs/:id
const updateMatch = async (req, res) => {
  try {
    const m = await ChMatch.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!m) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const { score_dom, score_ext, journee, date } = req.body;
    await m.update({
      score_dom: score_dom !== undefined && score_dom !== '' ? Number(score_dom) : null,
      score_ext: score_ext !== undefined && score_ext !== '' ? Number(score_ext) : null,
      journee: journee !== undefined ? (journee || null) : m.journee,
      date: date !== undefined ? (date || null) : m.date,
    });
    return res.json({ success: true, data: m });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /championnat/matchs/:id
const deleteMatch = async (req, res) => {
  try {
    const m = await ChMatch.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!m) return res.status(404).json({ success: false, message: 'Match introuvable' });
    await m.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /championnat/coachs?equipe_id=X — coachs d'une équipe
const getCoachs = async (req, res) => {
  try {
    const { EquipeCoach, User } = require('../models');
    const { equipe_id } = req.query;
    if (!equipe_id) return res.status(400).json({ success: false, message: 'equipe_id requis' });

    const links = await EquipeCoach.findAll({
      where: { equipe_id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'email', 'avatar'] }],
    });
    return res.json({ success: true, data: links.map(l => l.user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /championnat/coachs — ajouter un coach à une équipe
const addCoach = async (req, res) => {
  try {
    const { EquipeCoach } = require('../models');
    const { equipe_id, user_id } = req.body;
    if (!equipe_id || !user_id) return res.status(400).json({ success: false, message: 'equipe_id et user_id requis' });

    await EquipeCoach.findOrCreate({ where: { equipe_id, user_id } });
    return res.status(201).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /championnat/coachs — retirer un coach d'une équipe
const removeCoach = async (req, res) => {
  try {
    const { EquipeCoach } = require('../models');
    const { equipe_id, user_id } = req.body;
    await EquipeCoach.destroy({ where: { equipe_id, user_id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getClassement, getChampionnats,
  addEquipe, updateEquipe, removeEquipe,
  addMatch, updateMatch, deleteMatch,
  getCoachs, addCoach, removeCoach,
};
