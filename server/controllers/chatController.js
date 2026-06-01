const { Channel, Message, User } = require('../models');

const getChannels = async (req, res) => {
  try {
    const userId = req.user.id;
    const channels = await Channel.findAll({
      where: { actif: true }
    });

    const accessibles = channels.filter(ch => {
      if (['superadmin', 'admin', 'dirigeant'].includes(req.user.role)) return true;
      if (ch.club_id && ch.club_id !== req.user.club_id) return false;
      const membres = ch.membres || [];
      return membres.includes(userId) || ch.type === 'equipe' || ch.type === 'club';
    });

    return res.json({ success: true, data: accessibles });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.findAll({
      where: { channel_id: channelId, supprime: false },
      include: [{
        model: User, as: 'sender',
        attributes: ['id', 'nom', 'prenom', 'avatar']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createChannel = async (req, res) => {
  try {
    const { nom, type, equipe_id, membres } = req.body;
    const channel = await Channel.create({
      nom,
      type: type || 'groupe',
      club_id: req.user.club_id,
      equipe_id,
      membres: membres || [req.user.id],
      cree_par: req.user.id
    });
    return res.status(201).json({ success: true, data: channel });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { contenu, channel_id } = req.body;
    const message = await Message.create({
      channel_id,
      sender_id: req.user.id,
      contenu,
      type: 'texte'
    });

    const msgWithUser = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'nom', 'prenom', 'avatar'] }]
    });

    return res.status(201).json({ success: true, data: msgWithUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getChannels, getMessages, createChannel, sendMessage };
