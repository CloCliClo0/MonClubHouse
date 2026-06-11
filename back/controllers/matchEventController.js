const { MatchEvent, User, Match } = require('../models');

// GET /matchs/:id/events
const getByMatch = async (req, res) => {
  try {
    const events = await MatchEvent.findAll({
      where: { match_id: req.params.id },
      include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
      order: [['minute', 'ASC'], ['created_at', 'ASC']],
    });
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('[matchEvent.getByMatch]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /matchs/:id/events
const addEvent = async (req, res) => {
  try {
    const { type, minute, joueur_id, equipe, description } = req.body;
    const match = await Match.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    // Mettre le match en_cours si premier événement non-debut
    if (match.statut === 'programme' && type !== 'fin_mi_temps') {
      await match.update({ statut: 'en_cours' });
    }

    const event = await MatchEvent.create({
      match_id: match.id,
      club_id: req.user.club_id,
      type, minute: minute ?? null,
      joueur_id: joueur_id ?? null,
      equipe: equipe ?? null,
      description: description ?? null,
    });

    // Recalculer le score si c'est un but ou but_annulé
    if (type === 'but' || type === 'but_annule') {
      const allEvents = await MatchEvent.findAll({ where: { match_id: match.id } });
      let scoreEquipe = 0, scoreAdversaire = 0;
      for (const e of allEvents) {
        if (e.type === 'but') {
          if (match.domicile_exterieur === 'domicile' && e.equipe === 'domicile') scoreEquipe++;
          else if (match.domicile_exterieur === 'domicile' && e.equipe === 'exterieur') scoreAdversaire++;
          else if (match.domicile_exterieur === 'exterieur' && e.equipe === 'exterieur') scoreEquipe++;
          else if (match.domicile_exterieur === 'exterieur' && e.equipe === 'domicile') scoreAdversaire++;
        }
      }
      await match.update({ score_equipe: scoreEquipe, score_adversaire: scoreAdversaire });
    }

    // Émettre l'événement via Socket.io
    const io = req.app.get('io');
    if (io) {
      const populated = await MatchEvent.findByPk(event.id, {
        include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'avatar'] }],
      });
      io.to(`match:${match.id}`).emit('match:event', {
        event: populated,
        score_equipe: match.score_equipe,
        score_adversaire: match.score_adversaire,
        statut: match.statut,
      });
    }

    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error('[matchEvent.addEvent]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /matchs/:id/events/:eventId
const deleteEvent = async (req, res) => {
  try {
    const event = await MatchEvent.findOne({ where: { id: req.params.eventId, match_id: req.params.id } });
    if (!event) return res.status(404).json({ success: false, message: 'Événement introuvable' });
    await event.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('[matchEvent.deleteEvent]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /matchs/:id/end — terminer le match (mode live)
const endMatch = async (req, res) => {
  try {
    const match = await Match.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });
    await match.update({ statut: 'termine' });

    // Notification résultat pour les licenciés de l'équipe
    try {
      const { Licencie, User: U, Notification } = require('../models');
      const licencies = await Licencie.findAll({
        where: { equipe_id: match.equipe_id, statut: 'actif' },
        include: [{ model: U, as: 'user', attributes: ['id'] }],
      });
      const score = `${match.score_equipe ?? '?'} - ${match.score_adversaire ?? '?'}`;
      for (const l of licencies) {
        await Notification.create({
          user_id: l.user.id, type: 'resultat',
          titre: 'Résultat du match',
          contenu: `Match contre ${match.adversaire} : ${score}`,
          lien: `/resultats/${match.id}`,
        });
      }
      // Vote ouvert
      const convocations = await require('../models').Convocation.findAll({
        where: { match_id: match.id, statut: 'present' },
      });
      for (const c of convocations) {
        await Notification.create({
          user_id: c.joueur_id, type: 'vote',
          titre: '⭐ Votez pour le joueur du match !',
          contenu: `Match contre ${match.adversaire} terminé. Votez pour votre meilleur joueur !`,
          lien: `/vote/${match.id}`,
        });
      }
    } catch (notifErr) { console.warn('[matchEvent.endMatch] notif:', notifErr.message); }

    const io = req.app.get('io');
    if (io) io.to(`match:${match.id}`).emit('match:ended', { match_id: match.id });

    return res.json({ success: true, data: match });
  } catch (err) {
    console.error('[matchEvent.endMatch]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getByMatch, addEvent, deleteEvent, endMatch };
