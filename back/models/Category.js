const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  nom:     { type: DataTypes.STRING(100), allowNull: false },
  couleur: { type: DataTypes.STRING(7), defaultValue: '#1b4332' },
  actif:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categories' });

module.exports = Category;
