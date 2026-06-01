const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Composition = sequelize.define('Composition', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  match_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  formation: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '4-3-3' },
  titulaires: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  remplacants: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  notes_tactiques: { type: DataTypes.TEXT, allowNull: true },
  cree_par: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'compositions'
});

module.exports = Composition;
