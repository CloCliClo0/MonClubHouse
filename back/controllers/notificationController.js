const { Notification, Match, Convocation, User } = require('../models');
const { Op } = require('sequelize');

const createNotification = async ({ user_id, type, titre, contenu, lien, donnees }) => {
  return Notification.create({ user_id, type, titre, contenu, lien, donnees });
};

const getMes = async (req, res) => {
  try {
    const where = { user_id: req.user.id };
    // Le frontend (ex: cloche Topbar) demande "lu=false" pour n'afficher que les non-lues —
    // ce filtre était ignoré côté back, la liste renvoyait toujours les N plus récentes toutes
    // confondues, quitte à masquer des non-lues plus anciennes derrière des lues plus récentes.
    if (req.query.lu === 'true') where.lu = true;
    else if (req.query.lu === 'false') where.lu = false;

    const [notifications, nonLues] = await Promise.all([
      Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: Math.min(parseInt(req.query.limit, 10) || 50, 100)
      }),
      // Total réel des non-lues, indépendant de la pagination/du filtre ci-dessus —
      // sert de badge de compteur, ne doit jamais être plafonné par `limit`.
      Notification.count({ where: { user_id: req.user.id, lu: false } }),
    ]);
    return res.json({ success: true, data: { notifications, non_lues: nonLues } });
  } catch (err) {
    console.error('[notificationController]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification introuvable' });
    await notif.update({ lu: true, lu_at: new Date() });
    return res.json({ success: true });
  } catch (err) {
    console.error('[notificationController]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const marquerToutesLues = async (req, res) => {
  try {
    await Notification.update(
      { lu: true, lu_at: new Date() },
      { where: { user_id: req.user.id, lu: false } }
    );
    return res.json({ success: true, message: 'Toutes les notifications sont marquées comme lues' });
  } catch (err) {
    console.error('[notificationController]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Cron J-1 : crée des rappels pour les matchs/entraînements de demain
const createReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const matchs = await Match.findAll({
      where: {
        date: dateStr,
        statut: 'programme',
      },
    });

    let created = 0;
    for (const match of matchs) {
      const convocations = await Convocation.findAll({ where: { match_id: match.id } });
      for (const conv of convocations) {
        const alreadyExists = await Notification.findOne({
          where: {
            user_id: conv.joueur_id,
            type: 'rappel_veille',
            donnees: { [Op.like]: `%"match_id":${match.id}%` },
          },
        });
        if (!alreadyExists) {
          const typeLabel = match.type === 'entrainement' ? 'entraînement' : 'match';
          const dt = match.date ? new Date(match.date) : null;
          const heureStr = dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (match.heure ? match.heure.substring(0, 5) : '?');
          await Notification.create({
            user_id: conv.joueur_id,
            type: 'rappel_veille',
            titre: `Rappel : ${typeLabel} demain`,
            contenu: `Vous avez un ${typeLabel} demain à ${heureStr}${match.adversaire ? ' contre ' + match.adversaire : ''}.`,
            lien: `/convocations`,
            donnees: JSON.stringify({ match_id: match.id }),
          });
          created++;
        }
      }
    }
    console.log(`[Cron rappels] ${created} rappel(s) J-1 créé(s) pour le ${dateStr}`);
    return created;
  } catch (err) {
    console.error('[createReminders]', err.message);
    throw err;
  }
};

module.exports = { createNotification, getMes, marquerLue, marquerToutesLues, createReminders };
