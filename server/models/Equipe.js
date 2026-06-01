const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Equipe = sequelize.define('Equipe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  sport_id: { type: DataTypes.INTEGER, allowNull: false },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  categorie: {
    type: DataTypes.ENUM(
      'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14',
      'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21',
      'Senior', 'Veteran', 'Loisir'
    ),
    allowNull: false
  },
  genre: {
    type: DataTypes.ENUM('masculin', 'feminin', 'mixte', 'handisport'),
    defaultValue: 'masculin'
  },
  format: {
    type: DataTypes.ENUM('4', '5', '7', '8', '11', '15', 'autre'),
    defaultValue: '11'
  },
  couleur_maillot: { type: DataTypes.STRING(7), allowNull: true },
  coach_id: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'equipes'
});

module.exports = Equipe;
