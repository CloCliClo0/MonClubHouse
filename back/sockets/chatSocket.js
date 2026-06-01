const { Message, User, Channel, Notification } = require('../models');
const { verifyAccessToken } = require('../config/jwt');

module.exports = (io) => {
  // Authentification Socket.io via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Token manquant'));

      const decoded = verifyAccessToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'nom', 'prenom', 'avatar', 'role', 'club_id']
      });
      if (!user) return next(new Error('Utilisateur introuvable'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.nom} ${user.prenom} connecté (${socket.id})`);

    // Rejoindre les salles de l'utilisateur
    socket.on('join:channels', async () => {
      try {
        const channels = await Channel.findAll({ where: { actif: true } });
        for (const ch of channels) {
          const membres = ch.membres || [];
          if (
            membres.includes(user.id) ||
            (ch.club_id === user.club_id) ||
            ['superadmin', 'admin', 'dirigeant'].includes(user.role)
          ) {
            socket.join(`channel:${ch.id}`);
          }
        }
        socket.emit('channels:joined', { success: true });
      } catch (err) {
        socket.emit('error', { message: 'Erreur lors du chargement des canaux' });
      }
    });

    // Rejoindre un canal spécifique
    socket.on('channel:join', async ({ channel_id }) => {
      const channel = await Channel.findByPk(channel_id);
      if (!channel) return socket.emit('error', { message: 'Canal introuvable' });
      socket.join(`channel:${channel_id}`);
      socket.emit('channel:joined', { channel_id });
    });

    // Envoyer un message
    socket.on('message:send', async ({ channel_id, contenu, type = 'texte' }) => {
      try {
        if (!contenu || contenu.trim().length === 0) {
          return socket.emit('error', { message: 'Message vide' });
        }
        if (contenu.length > 5000) {
          return socket.emit('error', { message: 'Message trop long' });
        }

        const message = await Message.create({
          channel_id,
          sender_id: user.id,
          contenu: contenu.trim(),
          type
        });

        const msgFull = await Message.findByPk(message.id, {
          include: [{
            model: User, as: 'sender',
            attributes: ['id', 'nom', 'prenom', 'avatar']
          }]
        });

        // Broadcast dans le canal
        io.to(`channel:${channel_id}`).emit('message:new', msgFull);

        // Notifier les membres non connectés
        const channel = await Channel.findByPk(channel_id);
        if (channel) {
          const membres = channel.membres || [];
          for (const membreId of membres) {
            if (membreId !== user.id) {
              await Notification.create({
                user_id: membreId,
                type: 'message',
                titre: `Nouveau message de ${user.nom}`,
                contenu: contenu.substring(0, 100),
                lien: `/chat?channel=${channel_id}`,
                donnees: { channel_id, sender_id: user.id }
              });

              const memberSocket = findSocketByUserId(io, membreId);
              if (memberSocket) {
                memberSocket.emit('notification:new', {
                  type: 'message',
                  titre: `Nouveau message de ${user.nom}`,
                  channel_id
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[Socket] Erreur message:send', err);
        socket.emit('error', { message: 'Erreur envoi message' });
      }
    });

    // Saisie en cours
    socket.on('typing:start', ({ channel_id }) => {
      socket.to(`channel:${channel_id}`).emit('typing:user', {
        user_id: user.id,
        nom: user.nom,
        channel_id
      });
    });

    socket.on('typing:stop', ({ channel_id }) => {
      socket.to(`channel:${channel_id}`).emit('typing:stopped', {
        user_id: user.id,
        channel_id
      });
    });

    // Marquer comme lu
    socket.on('messages:read', async ({ channel_id }) => {
      try {
        const messages = await Message.findAll({
          where: { channel_id, supprime: false }
        });
        for (const msg of messages) {
          const luPar = msg.lu_par || [];
          if (!luPar.includes(user.id)) {
            luPar.push(user.id);
            await msg.update({ lu_par: luPar });
          }
        }
        socket.emit('messages:read:ok', { channel_id });
      } catch (err) {
        socket.emit('error', { message: 'Erreur lecture messages' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.nom} ${user.prenom} déconnecté`);
    });
  });
};

function findSocketByUserId(io, userId) {
  for (const [, socket] of io.sockets.sockets) {
    if (socket.user && socket.user.id === userId) return socket;
  }
  return null;
}
