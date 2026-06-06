const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChEquipe = sequelize.define('ChEquipe', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id:       { type: DataTypes.INTEGER, allowNull: false },
  equipe_ref_id: { type: DataTypes.INTEGER, allowNull: false }, // equipe du club propriétaire du championnat
  equipe_id:     { type: DataTypes.INTEGER, allowNull: true },  // null = équipe externe
  nom:           { type: DataTypes.STRING(200), allowNull: false },
  saison:        { type: DataTypes.STRING(20), allowNull: false },
  championnat:   { type: DataTypes.STRING(200), allowNull: true },
  couleur:       { type: DataTypes.STRING(7), defaultValue: '#6c757d' },
}, { tableName: 'ch_equipes' });

module.exports = ChEquipe;
