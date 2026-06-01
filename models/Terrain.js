const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Terrain = sequelize.define('Terrain', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.ENUM('gazon_naturel', 'gazon_synthetique', 'salle', 'gymnase', 'piste', 'autre'),
    defaultValue: 'gazon_naturel'
  },
  capacite: { type: DataTypes.INTEGER, allowNull: true },
  adresse: { type: DataTypes.STRING(500), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'terrains'
});

module.exports = Terrain;
