const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Club = sequelize.define('Club', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  logo: { type: DataTypes.STRING(500), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  adresse: { type: DataTypes.STRING(500), allowNull: true },
  ville: { type: DataTypes.STRING(100), allowNull: true },
  code_postal: { type: DataTypes.STRING(10), allowNull: true },
  telephone: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  site_web: { type: DataTypes.STRING(500), allowNull: true },
  reseaux_sociaux: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  couleur_primaire: { type: DataTypes.STRING(7), defaultValue: '#2d6a4f' },
  couleur_secondaire: { type: DataTypes.STRING(7), defaultValue: '#ffffff' },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  numero_affiliation: { type: DataTypes.STRING(50), allowNull: true }
}, {
  tableName: 'clubs'
});

module.exports = Club;
