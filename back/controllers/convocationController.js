const { Convocation, Match, User, Equipe, Terrain, Notification } = require('../models');
const { createNotification } = require('./notificationController');
const { sendBulkConvocationEmails } = require('../services/emailService');

const getByMatch = async (req, res) => {
  try {
    const convocations = await Convocation.findAll({
      where: { match_id: req.params.matchId },
      include: [{
        model: User, as: 'joueur',
        attributes: ['id', 'nom', 'prenom', 'email', 'avatar', 'telephone', 'notif_email']
      }],
      order: [['createdAt', 'ASC']],
    });
    return res.json({ success: true, data: convocations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const creerConvocations = async (req, res) => {
  try {
    const { match_id, joueur_ids, envoyer_email = false } = req.body;

    const match = await Match.findByPk(match_id, {
      include: [
        { model: Equipe, as: 'equipe', include: [{ model: require('../models').Club, as: 'club' }] },
        { model: Terrain, as: 'terrain' },
      ],
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const joueurs = [];
    const convocations = [];

    for (const joueurId of joueur_ids) {
      const [conv, created] = await Convocation.findOrCreate({
        where: { match_id, joueur_id: joueurId },
        defaults: { statut: 'convoque' },
      });

      if (created) {
        convocations.push(conv);

        const typeLabel = match.type === 'entrainement' ? 'Entraînement' : 'Match';
        await createNotification({
          user_id: joueurId,
          type: 'convocation',
          titre: `Convocation — ${typeLabel}`,
          contenu: `Vous êtes convoqué(e) pour le ${new Date(match.date).toLocaleDateString('fr-FR')}${match.adversaire ? ' contre ' + match.adversaire : ''}`,
          lien: `/convocations`,
          donnees: { match_id },
        });
      }

      if (envoyer_email) {
        const joueur = await User.findByPk(joueurId, {
          attributes: ['id', 'nom', 'prenom', 'email', 'notif_email'],
        });
        if (joueur) joueurs.push(joueur);
      }
    }

    // Marquer comme notifiés
    await Convocation.update(
      { notifie: true, notifie_at: new Date() },
      { where: { match_id, joueur_id: joueur_ids } }
    );

    // Envoi emails en arrière-plan (ne bloque pas la réponse)
    let emailReport = null;
    if (envoyer_email && joueurs.length > 0) {
      emailReport = await sendBulkConvocationEmails({
        joueurs,
        match,
        club: match.equipe?.club || null,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${convocations.length} convocation(s) créée(s)`,
      data: convocations,
      email: emailReport,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const repondre = async (req, res) => {
  try {
    const { statut, motif_absence } = req.body;
    const validStatuts = ['present', 'absent', 'incertain'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const conv = await Convocation.findOne({
      where: { match_id: req.params.matchId, joueur_id: req.user.id },
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Convocation introuvable' });

    await conv.update({
      statut,
      motif_absence: statut === 'absent' ? motif_absence : null,
      reponse_at: new Date(),
    });

    return res.json({ success: true, data: conv });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const repondreParent = async (req, res) => {
  try {
    const { statut, joueur_id, motif_absence } = req.body;

    const enfant = await User.findOne({ where: { id: joueur_id, parent_id: req.user.id } });
    if (!enfant) return res.status(403).json({ success: false, message: 'Enfant introuvable' });

    const conv = await Convocation.findOne({
      where: { match_id: req.params.matchId, joueur_id },
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Convocation introuvable' });

    await conv.update({ statut, motif_absence, reponse_at: new Date() });
    return res.json({ success: true, data: conv });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Renvoyer la convocation d'un joueur spécifique par email
const renvoyerEmail = async (req, res) => {
  const { sendConvocationEmail } = require('../services/emailService');
  try {
    const { matchId, joueurId } = req.params;

    const match = await Match.findByPk(matchId, {
      include: [
        { model: Equipe, as: 'equipe', include: [{ model: require('../models').Club, as: 'club' }] },
        { model: Terrain, as: 'terrain' },
      ],
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const joueur = await User.findByPk(joueurId, {
      attributes: ['id', 'nom', 'prenom', 'email', 'notif_email'],
    });
    if (!joueur || !joueur.email) {
      return res.status(404).json({ success: false, message: 'Joueur ou email introuvable' });
    }

    const result = await sendConvocationEmail({ joueur, match, club: match.equipe?.club });
    return res.json({ success: result.sent, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getByMatch, creerConvocations, repondre, repondreParent, renvoyerEmail };
