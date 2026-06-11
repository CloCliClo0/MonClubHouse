const { PlayerVote, Convocation, Match, User } = require('../models');
const { Op } = require('sequelize');

// GET /votes/:matchId
const getVotes = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    const club_id = req.user.club_id;

    const match = await Match.findOne({ where: { id: matchId, club_id } });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    if (match.statut !== 'termine') {
      return res.status(403).json({ success: false, message: 'Le vote est ouvert uniquement après la fin du match' });
    }

    // Vérifier que l'utilisateur était convoqué
    const convocation = await Convocation.findOne({ where: { match_id: matchId, joueur_id: userId } });
    const isParent = req.user.role === 'parent';
    if (!convocation && !isParent && !['admin', 'superadmin', 'dirigeant', 'coach'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Vous n\'étiez pas convoqué à ce match' });
    }

    // Mon vote
    const monVote = await PlayerVote.findOne({ where: { match_id: matchId, voter_id: userId } });

    // Résultats des votes
    const votes = await PlayerVote.findAll({
      where: { match_id: matchId },
      include: [{ model: User, as: 'voted_for', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
    });

    // Classement
    const counts = {};
    for (const v of votes) {
      const id = v.voted_for_id;
      if (!counts[id]) counts[id] = { user: v.voted_for, count: 0 };
      counts[id].count++;
    }
    const classement = Object.values(counts).sort((a, b) => b.count - a.count);

    // Joueurs convoqués (pour le choix)
    const convocations = await Convocation.findAll({
      where: { match_id: matchId },
      include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
    });

    return res.json({
      success: true,
      data: {
        match_id: matchId,
        mon_vote: monVote ? monVote.voted_for_id : null,
        classement,
        total_votes: votes.length,
        convocations: convocations.map(c => c.joueur),
      },
    });
  } catch (err) {
    console.error('[vote.getVotes]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /votes/:matchId
const voter = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    const { voted_for_id } = req.body;
    const club_id = req.user.club_id;

    const match = await Match.findOne({ where: { id: matchId, club_id } });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    if (match.statut !== 'termine') {
      return res.status(403).json({ success: false, message: 'Vote impossible avant la fin du match' });
    }
    if (!voted_for_id) return res.status(400).json({ success: false, message: 'voted_for_id requis' });
    if (Number(voted_for_id) === userId) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas voter pour vous-même' });
    }

    const existing = await PlayerVote.findOne({ where: { match_id: matchId, voter_id: userId } });
    if (existing) return res.status(409).json({ success: false, message: 'Vous avez déjà voté pour ce match' });

    const vote = await PlayerVote.create({
      match_id: matchId, club_id, voter_id: userId, voted_for_id,
    });
    return res.status(201).json({ success: true, data: vote });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Vous avez déjà voté pour ce match' });
    }
    console.error('[vote.voter]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getVotes, voter };
