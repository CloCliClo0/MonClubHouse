const { Convocation, Match, User, Notification, Licencie } = require('../models');
const { createNotification } = require('./notificationController');

const getByMatch = async (req, res) => {
  try {
    const convocations = await Convocation.findAll({
      where: { match_id: req.params.matchId },
      include: [{
        model: User, as: 'joueur',
        attributes: ['id', 'nom', 'prenom', 'avatar', 'telephone']
      }]
    });
    return res.json({ success: true, data: convocations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const creerConvocations = async (req, res) => {
  try {
    const { match_id, joueur_ids } = req.body;

    const match = await Match.findByPk(match_id, {
      include: [{ model: require('../models').Equipe, as: 'equipe' }]
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const convocations = [];
    for (const joueurId of joueur_ids) {
      const [conv, created] = await Convocation.findOrCreate({
        where: { match_id, joueur_id: joueurId },
        defaults: { statut: 'convoque' }
      });

      if (created) {
        convocations.push(conv);
        await createNotification({
          user_id: joueurId,
          type: 'convocation',
          titre: `Convocation - ${match.type === 'match' ? 'Match' : 'Entraînement'}`,
          contenu: `Vous êtes convoqué(e) pour le ${new Date(match.date).toLocaleDateString('fr-FR')}${match.adversaire ? ' contre ' + match.adversaire : ''}`,
          lien: `/matchs/${match_id}`,
          donnees: { match_id }
        });
      }
    }

    await Convocation.update({ notifie: true, notifie_at: new Date() }, {
      where: { match_id, joueur_id: joueur_ids }
    });

    return res.status(201).json({
      success: true,
      message: `${convocations.length} convocation(s) créée(s)`,
      data: convocations
    });
  } catch (err) {
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
      where: { match_id: req.params.matchId, joueur_id: req.user.id }
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Convocation introuvable' });

    await conv.update({
      statut,
      motif_absence: statut === 'absent' ? motif_absence : null,
      reponse_at: new Date()
    });

    return res.json({ success: true, data: conv });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const repondreParent = async (req, res) => {
  try {
    const { statut, joueur_id, motif_absence } = req.body;

    const enfant = await User.findOne({
      where: { id: joueur_id, parent_id: req.user.id }
    });
    if (!enfant) return res.status(403).json({ success: false, message: 'Enfant introuvable' });

    const conv = await Convocation.findOne({
      where: { match_id: req.params.matchId, joueur_id }
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Convocation introuvable' });

    await conv.update({ statut, motif_absence, reponse_at: new Date() });
    return res.json({ success: true, data: conv });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getByMatch, creerConvocations, repondre, repondreParent };
