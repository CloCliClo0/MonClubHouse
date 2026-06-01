const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  channel_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('texte', 'image', 'fichier', 'systeme'),
    defaultValue: 'texte'
  },
  fichier_url: { type: DataTypes.STRING(500), allowNull: true },
  lu_par: { type: DataTypes.JSON, defaultValue: [] },
  modifie: { type: DataTypes.BOOLEAN, defaultValue: false },
  supprime: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'messages'
});

module.exports = Message;
