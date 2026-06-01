const { Notification } = require('../models');

const createNotification = async ({ user_id, type, titre, contenu, lien, donnees }) => {
  return Notification.create({ user_id, type, titre, contenu, lien, donnees });
};

const getMes = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    const nonLues = notifications.filter(n => !n.lu).length;
    return res.json({ success: true, data: { notifications, non_lues: nonLues } });
  } catch (err) {
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
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { createNotification, getMes, marquerLue, marquerToutesLues };
