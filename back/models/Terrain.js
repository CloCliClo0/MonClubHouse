const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Terrain = sequelize.define('Terrain', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id:     { type: DataTypes.INTEGER, allowNull: false },
  nom:         { type: DataTypes.STRING(200), allowNull: false },
  adresse:     { type: DataTypes.STRING(255), allowNull: true },
  ville:       { type: DataTypes.STRING(100), allowNull: true },
  code_postal: { type: DataTypes.STRING(10), allowNull: true },
  capacite:    { type: DataTypes.INTEGER, allowNull: true },
  actif:       { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'terrains'
});

module.exports = Terrain;
