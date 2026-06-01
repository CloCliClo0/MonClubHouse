import User from './User';
import Club from './Club';
import Terrain from './Terrain';
import Sport from './Sport';
import Equipe from './Equipe';
import Licencie from './Licencie';
import Match from './Match';
import Convocation from './Convocation';
import Composition from './Composition';
import Channel from './Channel';
import Message from './Message';
import Notification from './Notification';

// Club associations
Club.hasMany(Terrain, { foreignKey: 'club_id', as: 'terrains' });
Terrain.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

Club.hasMany(Equipe, { foreignKey: 'club_id', as: 'equipes' });
Equipe.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

Club.hasMany(Channel, { foreignKey: 'club_id', as: 'channels' });
Channel.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

Club.hasMany(User, { foreignKey: 'club_id', as: 'membres' });
User.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

// Sport associations
Sport.hasMany(Equipe, { foreignKey: 'sport_id', as: 'equipes' });
Equipe.belongsTo(Sport, { foreignKey: 'sport_id', as: 'sport' });

// Equipe associations
Equipe.hasMany(Licencie, { foreignKey: 'equipe_id', as: 'licencies' });
Licencie.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

Equipe.hasMany(Match, { foreignKey: 'equipe_id', as: 'matchs' });
Match.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

Equipe.hasMany(Channel, { foreignKey: 'equipe_id', as: 'channels' });
Channel.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

Equipe.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

// User associations
User.hasMany(Licencie, { foreignKey: 'user_id', as: 'licences' });
Licencie.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Convocation, { foreignKey: 'user_id', as: 'convocations' });
Convocation.belongsTo(User, { foreignKey: 'user_id', as: 'joueur' });

User.hasMany(Message, { foreignKey: 'user_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'user_id', as: 'auteur' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Composition, { foreignKey: 'user_id', as: 'compositions' });
Composition.belongsTo(User, { foreignKey: 'user_id', as: 'joueur' });

// Parent/enfant
User.hasMany(User, { foreignKey: 'parent_id', as: 'enfants' });
User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });

// Match associations
Match.hasMany(Convocation, { foreignKey: 'match_id', as: 'convocations' });
Convocation.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

Match.hasMany(Composition, { foreignKey: 'match_id', as: 'compositions' });
Composition.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

Match.belongsTo(Terrain, { foreignKey: 'terrain_id', as: 'terrain' });
Match.belongsTo(User, { foreignKey: 'cree_par', as: 'createur' });

// Channel / Message associations
Channel.hasMany(Message, { foreignKey: 'channel_id', as: 'messages' });
Message.belongsTo(Channel, { foreignKey: 'channel_id', as: 'channel' });

export {
  User,
  Club,
  Terrain,
  Sport,
  Equipe,
  Licencie,
  Match,
  Convocation,
  Composition,
  Channel,
  Message,
  Notification,
};
