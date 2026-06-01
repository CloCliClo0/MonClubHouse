const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Channel = sequelize.define('Channel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.ENUM('equipe', 'club', 'prive', 'groupe', 'dirigeants'),
    defaultValue: 'equipe'
  },
  club_id: { type: DataTypes.INTEGER, allowNull: true },
  equipe_id: { type: DataTypes.INTEGER, allowNull: true },
  membres: { type: DataTypes.JSON, defaultValue: [] },
  cree_par: { type: DataTypes.INTEGER, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'channels'
});

module.exports = Channel;
