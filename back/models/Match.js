const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Match = sequelize.define('Match', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  equipe_id: { type: DataTypes.INTEGER, allowNull: false },
  terrain_id: { type: DataTypes.INTEGER, allowNull: true },
  adversaire: { type: DataTypes.STRING(200), allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false },
  lieu: { type: DataTypes.STRING(500), allowNull: true },
  type: {
    type: DataTypes.ENUM('match', 'entrainement', 'tournoi', 'amical', 'coupe'),
    defaultValue: 'match'
  },
  domicile_exterieur: {
    type: DataTypes.ENUM('domicile', 'exterieur', 'neutre'),
    defaultValue: 'domicile'
  },
  score_equipe: { type: DataTypes.INTEGER, allowNull: true },
  score_adversaire: { type: DataTypes.INTEGER, allowNull: true },
  statut: {
    type: DataTypes.ENUM('programme', 'en_cours', 'termine', 'annule', 'reporte'),
    defaultValue: 'programme'
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  rapport: { type: DataTypes.TEXT, allowNull: true },
  heure_rdv: { type: DataTypes.TIME, allowNull: true },
  championnat: { type: DataTypes.STRING(200), allowNull: true },
  journee: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'matchs'
});

module.exports = Match;
