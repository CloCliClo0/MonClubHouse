const sequelize = require('../config/db');
const User = require('./User');
const Club = require('./Club');
const InviteCode = require('./InviteCode');
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
const Adversaire = require('./Adversaire');
const ChEquipe = require('./ChEquipe');
const ChMatch = require('./ChMatch');
const EquipeCoach = require('./EquipeCoach');
const MatchEvent = require('./MatchEvent');
const PlayerVote = require('./PlayerVote');
const ArbitragePresence = require('./ArbitragePresence');

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
User.hasOne(Licencie,  { foreignKey: 'user_id', as: 'licence' });          // profil (équipe principale)
User.hasMany(Licencie, { foreignKey: 'user_id', as: 'licencies_equipes' }); // multi-équipes
Licencie.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Parent-Enfant
User.hasMany(User, { foreignKey: 'parent_id', as: 'enfants' });
User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });

// Associations Match
Match.hasMany(Convocation, { foreignKey: 'match_id', as: 'convocations' });
Convocation.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

Match.hasOne(Composition, { foreignKey: 'match_id', as: 'composition' });
Composition.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

Match.belongsTo(Terrain, { foreignKey: 'terrain_id', as: 'terrain' });
Terrain.hasMany(Match, { foreignKey: 'terrain_id', as: 'matchs' });

// Coach d'équipe
Equipe.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });
User.hasMany(Equipe, { foreignKey: 'coach_id', as: 'equipes_coachs' });

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

// Invite codes
InviteCode.belongsTo(Club,  { foreignKey: 'club_id',   as: 'club' });
InviteCode.belongsTo(Equipe,{ foreignKey: 'equipe_id', as: 'equipe' });
InviteCode.belongsTo(User,  { foreignKey: 'created_by',as: 'createur' });

// Adversaires
Club.hasMany(Adversaire, { foreignKey: 'club_id', as: 'adversaires' });
Adversaire.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });

// Championnat
ChEquipe.hasMany(ChMatch, { foreignKey: 'dom_id', as: 'matchs_dom' });
ChEquipe.hasMany(ChMatch, { foreignKey: 'ext_id', as: 'matchs_ext' });
ChMatch.belongsTo(ChEquipe, { foreignKey: 'dom_id', as: 'dom' });
ChMatch.belongsTo(ChEquipe, { foreignKey: 'ext_id', as: 'ext' });

// Multi-coachs par équipe
Equipe.belongsToMany(User, { through: EquipeCoach, foreignKey: 'equipe_id', as: 'coachs_extra' });
User.belongsToMany(Equipe, { through: EquipeCoach, foreignKey: 'user_id', as: 'equipes_coachs_extra' });
EquipeCoach.belongsTo(User,   { foreignKey: 'user_id',   as: 'user' });
EquipeCoach.belongsTo(Equipe, { foreignKey: 'equipe_id', as: 'equipe' });

// MatchEvent associations
Match.hasMany(MatchEvent, { foreignKey: 'match_id', as: 'events' });
MatchEvent.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
User.hasMany(MatchEvent, { foreignKey: 'joueur_id', as: 'match_events' });
MatchEvent.belongsTo(User, { foreignKey: 'joueur_id', as: 'joueur' });

// PlayerVote associations
Match.hasMany(PlayerVote, { foreignKey: 'match_id', as: 'votes' });
PlayerVote.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
User.hasMany(PlayerVote, { foreignKey: 'voter_id', as: 'votes_emis' });
PlayerVote.belongsTo(User, { foreignKey: 'voter_id', as: 'voter' });
User.hasMany(PlayerVote, { foreignKey: 'voted_for_id', as: 'votes_recus' });
PlayerVote.belongsTo(User, { foreignKey: 'voted_for_id', as: 'voted_for' });

// ArbitragePresence associations
User.hasMany(ArbitragePresence, { foreignKey: 'user_id', as: 'arbitrage_presences' });
ArbitragePresence.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Club,
  InviteCode,
  Terrain,
  Sport,
  Equipe,
  Licencie,
  Match,
  Convocation,
  Composition,
  Message,
  Channel,
  Notification,
  Adversaire,
  ChEquipe,
  ChMatch,
  EquipeCoach,
  MatchEvent,
  PlayerVote,
  ArbitragePresence,
};
