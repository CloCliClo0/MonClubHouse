const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MatchEvent = sequelize.define('MatchEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  match_id: { type: DataTypes.INTEGER, allowNull: false },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'but', 'but_annule', 'carton_jaune', 'carton_rouge',
      'remplacement', 'fin_mi_temps', 'debut'
    ),
    allowNull: false
  },
  minute: { type: DataTypes.INTEGER, allowNull: true },
  joueur_id: { type: DataTypes.INTEGER, allowNull: true },
  equipe: { type: DataTypes.ENUM('domicile', 'exterieur'), allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'match_events',
  updatedAt: false
});

module.exports = MatchEvent;
