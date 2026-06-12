const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  club_id: { type: DataTypes.INTEGER, allowNull: true },
  type: {
    type: DataTypes.ENUM(
      'convocation', 'match', 'message', 'resultat',
      'systeme', 'rappel', 'annulation', 'info',
      'vote', 'arbitrage', 'rappel_veille'
    ),
    allowNull: false
  },
  titre:   { type: DataTypes.STRING(255), allowNull: false },
  // DB column is `message` — aliased as `contenu` for app consistency
  contenu: { type: DataTypes.TEXT, allowNull: true, field: 'message' },
  lien:    { type: DataTypes.STRING(500), allowNull: true },
  lu:      { type: DataTypes.BOOLEAN, defaultValue: false },
  lu_at:   { type: DataTypes.DATE, allowNull: true },
  // DB column is `data` — aliased as `donnees` for app consistency
  donnees: { type: DataTypes.JSON, allowNull: true, field: 'data' },
  send_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'notifications'
});

module.exports = Notification;
