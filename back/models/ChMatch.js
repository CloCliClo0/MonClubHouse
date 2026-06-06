const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChMatch = sequelize.define('ChMatch', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id:       { type: DataTypes.INTEGER, allowNull: false },
  equipe_ref_id: { type: DataTypes.INTEGER, allowNull: false },
  dom_id:        { type: DataTypes.INTEGER, allowNull: false }, // FK ch_equipes
  ext_id:        { type: DataTypes.INTEGER, allowNull: false }, // FK ch_equipes
  journee:       { type: DataTypes.INTEGER, allowNull: true },
  date:          { type: DataTypes.DATEONLY, allowNull: true },
  score_dom:     { type: DataTypes.INTEGER, allowNull: true },
  score_ext:     { type: DataTypes.INTEGER, allowNull: true },
  saison:        { type: DataTypes.STRING(20), allowNull: false },
  championnat:   { type: DataTypes.STRING(200), allowNull: true },
}, { tableName: 'ch_matchs' });

module.exports = ChMatch;
