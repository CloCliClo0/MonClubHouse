const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'convocation', 'match', 'message', 'resultat',
      'systeme', 'rappel', 'annulation'
    ),
    allowNull: false
  },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  lien: { type: DataTypes.STRING(500), allowNull: true },
  lu: { type: DataTypes.BOOLEAN, defaultValue: false },
  lu_at: { type: DataTypes.DATE, allowNull: true },
  donnees: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'notifications'
});

module.exports = Notification;
