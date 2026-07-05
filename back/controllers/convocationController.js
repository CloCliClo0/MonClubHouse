const { Convocation, Match, User, Equipe, Terrain, Notification, Licencie } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');
const { sendBulkConvocationEmails } = require('../services/emailService');

const getByMatch = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.matchId, { attributes: ['id', 'equipe_id'] });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    // Joueur/parent : uniquement s'ils (ou leur enfant) sont eux-mêmes convoqués à ce match
    if (['joueur', 'parent'].includes(req.user.role)) {
      const idsAutorises = [req.user.id];
      if (req.user.role === 'parent') {
        const enfants = await User.findAll({ where: { parent_id: req.user.id }, attributes: ['id'] });
        idsAutorises.push(...enfants.map(e => e.id));
      }
      const estConvoque = await Convocation.findOne({
        where: { match_id: req.params.matchId, joueur_id: { [Op.in]: idsAutorises } },
        attributes: ['id'],
      });
      if (!estConvoque) return res.status(403).json({ success: false, message: 'Vous n\'êtes pas convoqué à ce match' });
    }

    // Joueur/parent : pas besoin de l'email des coéquipiers
    const joueurAttributes = ['coach', 'dirigeant', 'admin', 'superadmin'].includes(req.user.role)
      ? ['id', 'nom', 'prenom', 'email', 'avatar', 'role']
      : ['id', 'nom', 'prenom', 'avatar', 'role'];

    const convocations = await Convocation.findAll({
      where: { match_id: req.params.matchId },
      include: [{
        model: User, as: 'joueur',
        attributes: joueurAttributes,
        include: [{
          model: Licencie, as: 'licence',
          attributes: ['numero_maillot', 'poste'],
          where: { equipe_id: match.equipe_id },
          required: false,
        }],
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
    const { match_id, envoyer_email = false } = req.body;
    let { joueur_ids } = req.body;

    const match = await Match.findByPk(match_id, {
      include: [
        { model: Equipe, as: 'equipe', include: [{ model: require('../models').Club, as: 'club' }] },
        { model: Terrain, as: 'terrain' },
      ],
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    // Ne convoquer que des comptes joueur — un compte parent peut apparaître dans le roster de
    // l'équipe (Licencie créé pour la visibilité du parent, cf. rosterService.assignUserToEquipes)
    // sans jamais être lui-même convocable à un match.
    const joueursValides = await User.findAll({
      where: { id: { [Op.in]: joueur_ids }, role: 'joueur' },
      attributes: ['id'],
    });
    joueur_ids = joueursValides.map(u => u.id);

    // 1. Requête unique : trouver les convocations déjà existantes
    const existing = await Convocation.findAll({
      where: { match_id, joueur_id: { [Op.in]: joueur_ids } },
      attributes: ['joueur_id'],
    });
    const existingIds = new Set(existing.map(c => c.joueur_id));
    const newJoueurIds = joueur_ids.filter(id => !existingIds.has(id));

    // 2. Bulk create des nouvelles convocations (1 requête au lieu de N)
    let newConvocations = [];
    if (newJoueurIds.length > 0) {
      newConvocations = await Convocation.bulkCreate(
        newJoueurIds.map(joueur_id => ({ match_id, joueur_id, statut: 'convoque' })),
        { ignoreDuplicates: true }
      );

      // 3. Notifications en parallèle (au lieu de séquentielles)
      const typeLabel = match.type === 'entrainement' ? 'Entraînement' : 'Match';
      const dateStr = new Date(match.date).toLocaleDateString('fr-FR');
      await Promise.all(newJoueurIds.map(joueurId => createNotification({
        user_id: joueurId,
        type: 'convocation',
        titre: `Convocation — ${typeLabel}`,
        contenu: `Vous êtes convoqué(e) pour le ${dateStr}${match.adversaire ? ' contre ' + match.adversaire : ''}`,
        lien: `/convocations`,
        donnees: { match_id },
      })));
    }

    // 4. Marquer comme notifiés
    await Convocation.update(
      { notifie: true, notifie_at: new Date() },
      { where: { match_id, joueur_id: joueur_ids } }
    );

    // 5. Emails si demandé — 1 seule requête User.findAll
    let emailReport = null;
    if (envoyer_email && newJoueurIds.length > 0) {
      const joueurs = await User.findAll({
        where: { id: { [Op.in]: newJoueurIds } },
        attributes: ['id', 'nom', 'prenom', 'email', 'notif_email'],
      });
      emailReport = await sendBulkConvocationEmails({
        joueurs,
        match,
        club: match.equipe?.club || null,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${newConvocations.length} convocation(s) créée(s)`,
      data: newConvocations,
      email: emailReport,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const repondre = async (req, res) => {
  try {
    const { statut, motif_absence, joueur_id } = req.body;
    const validStatuts = ['present', 'absent', 'incertain'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    // Déterminer l'ID du joueur cible
    let targetJoueurId = req.user.id;

    if (['coach', 'dirigeant', 'admin', 'superadmin'].includes(req.user.role) && joueur_id) {
      // Coach/admin peut répondre pour n'importe quel joueur
      targetJoueurId = joueur_id;
    } else if (req.user.role === 'parent' && joueur_id) {
      // Parent peut répondre pour son enfant uniquement
      const enfant = await User.findOne({ where: { id: joueur_id, parent_id: req.user.id } });
      if (!enfant) return res.status(403).json({ success: false, message: 'Enfant introuvable' });
      targetJoueurId = joueur_id;
    }

    const conv = await Convocation.findOne({
      where: { match_id: req.params.matchId, joueur_id: targetJoueurId },
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

    const validStatuts = ['present', 'absent', 'incertain'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

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

// GET /matchs/:matchId/sms-links — liens SMS natifs pour le coach
const getSmsLinks = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findByPk(matchId, {
      include: [
        { model: Equipe, as: 'equipe', include: [{ model: require('../models').Club, as: 'club' }] },
        { model: Terrain, as: 'terrain' },
      ],
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const convocations = await Convocation.findAll({
      where: { match_id: matchId },
      include: [{ model: User, as: 'joueur', attributes: ['id', 'nom', 'prenom', 'telephone'] }],
    });

    const dateStr = match.date ? new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '?';
    const heureStr = match.heure ? match.heure.substring(0, 5) : '?';
    const heureRdvStr = match.heure_rdv ? ` (RDV ${new Date(match.heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})` : '';
    const lieuStr = match.terrain?.nom || match.lieu || '?';
    const adversaireStr = match.adversaire ? ` contre ${match.adversaire}` : '';
    const typeLabel = match.type === 'entrainement' ? 'Entraînement' : 'Match';

    const links = convocations.map(conv => {
      const j = conv.joueur;
      if (!j?.telephone) return { joueur: j, telephone: null, smsUri: null, whatsappUri: null };
      const tel = j.telephone.replace(/\s+/g, '').replace(/^0/, '+33');
      const body = `Bonjour ${j.prenom}, ${typeLabel} le ${dateStr} à ${heureStr}${heureRdvStr}${adversaireStr} - Lieu : ${lieuStr}. Bonne chance ! 🏆`;
      const smsUri = `sms:${tel}?body=${encodeURIComponent(body)}`;
      const whatsappUri = `https://wa.me/${tel.replace(/^\+/, '')}?text=${encodeURIComponent(body)}`;
      return { joueur: { id: j.id, nom: j.nom, prenom: j.prenom }, telephone: tel, smsUri, whatsappUri, body };
    });

    return res.json({ success: true, data: links, match: { adversaire: match.adversaire, date: match.date, type: match.type } });
  } catch (err) {
    console.error('[convocation.getSmsLinks]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getByMatch, creerConvocations, repondre, repondreParent, renvoyerEmail, getSmsLinks };
