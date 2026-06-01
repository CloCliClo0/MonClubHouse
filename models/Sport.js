const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sport = sequelize.define('Sport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  icone: { type: DataTypes.STRING(100), allowNull: true },
  nb_joueurs_equipe: { type: DataTypes.INTEGER, defaultValue: 11 },
  categories_age: { type: DataTypes.JSON, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'sports'
});

module.exports = Sport;
