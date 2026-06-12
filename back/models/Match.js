const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Match = sequelize.define('Match', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  equipe_id:     { type: DataTypes.INTEGER, allowNull: false },
  club_id:       { type: DataTypes.INTEGER, allowNull: true },
  terrain_id:    { type: DataTypes.INTEGER, allowNull: true },
  adversaire_id: { type: DataTypes.INTEGER, allowNull: true },
  adversaire:    { type: DataTypes.STRING(200), allowNull: true },
  date:          { type: DataTypes.DATE, allowNull: true },
  heure:         { type: DataTypes.TIME, allowNull: true },
  heure_rdv:     { type: DataTypes.DATE, allowNull: true },
  lieu:          { type: DataTypes.STRING(500), allowNull: true },
  type: {
    type: DataTypes.ENUM('match', 'amical', 'coupe', 'tournoi', 'entrainement', 'autre'),
    defaultValue: 'match'
  },
  domicile_exterieur: {
    type: DataTypes.ENUM('domicile', 'exterieur'),
    defaultValue: 'domicile'
  },
  score_equipe:     { type: DataTypes.INTEGER, allowNull: true },
  score_adversaire: { type: DataTypes.INTEGER, allowNull: true },
  statut: {
    type: DataTypes.ENUM('programme', 'en_cours', 'termine', 'annule'),
    defaultValue: 'programme'
  },
  championnat: { type: DataTypes.STRING(100), allowNull: true },
  journee:     { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  rapport:     { type: DataTypes.TEXT, allowNull: true },
  actif:       { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'matchs'
});

module.exports = Match;
