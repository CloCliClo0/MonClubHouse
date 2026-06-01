const sequelize = require('../config/db');
const User = require('./User');
const Club = require('./Club');
const Terrain = require('./Terrain');
const Sport = require('./Sport');
const Equipe = require('./Equipe');
const Licencie = require('./Licencie');
const Match = require('./Match');
const Convocation = require('./Convocation');
const Composition = require('./Composition');
const Message = require('./Message');
const Channel = require('./Channel');
const Notification = require('./Notification');

// Associations Club
Club.hasMany(Terrain, { foreignKey: 'club_id', as: 'terrains' });
Terrain.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

Club.hasMany(Equipe, { foreignKey: 'club_id', as: 'equipes' });
Equipe.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

Club.hasMany(User, { foreignKey: 'club_id', as: 'membres' });
User.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

// Associations Sport
Sport.hasMany(Equipe, { foreignKey: 'sport_id', as: 'equipes' });
Equipe.belongsTo(Sport, { foreignKey: 'sport_id', as: 'sport' });

// Associations Equipe
Equipe.hasMany(Licencie, { foreignKey: 'equipe_id', as: 'licencies' });
Licencie.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

Equipe.hasMany(Match, { foreignKey: 'equipe_id', as: 'matchs' });
Match.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

// Associations User / Licencie
User.hasOne(Licencie, { foreignKey: 'user_id', as: 'licence' });
Licencie.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Parent-Enfant
User.hasMany(User, { foreignKey: 'parent_id', as: 'enfants' });
User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });

// Associations Match
Match.hasMany(Convocation, { foreignKey: 'match_id', as: 'convocations' });
Convocation.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

Match.hasOne(Composition, { foreignKey: 'match_id', as: 'composition' });
Composition.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

// Convocation - User
User.hasMany(Convocation, { foreignKey: 'joueur_id', as: 'convocations' });
Convocation.belongsTo(User, { foreignKey: 'joueur_id', as: 'joueur' });

// Associations Chat
Channel.hasMany(Message, { foreignKey: 'channel_id', as: 'messages' });
Message.belongsTo(Channel, { foreignKey: 'channel_id', as: 'channel' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages_envoyes' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Club,
  Terrain,
  Sport,
  Equipe,
  Licencie,
  Match,
  Convocation,
  Composition,
  Message,
  Channel,
  Notification
};
