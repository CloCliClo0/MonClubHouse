const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Adversaire = sequelize.define('Adversaire', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id:   { type: DataTypes.INTEGER, allowNull: false },
  nom:       { type: DataTypes.STRING(200), allowNull: false },
  categorie: { type: DataTypes.STRING(50), allowNull: true },
  ville:     { type: DataTypes.STRING(100), allowNull: true },
  contact:   { type: DataTypes.STRING(255), allowNull: true },
  telephone: { type: DataTypes.STRING(20), allowNull: true },
  couleur:   { type: DataTypes.STRING(7), defaultValue: '#1b4332' },
}, {
  tableName: 'adversaires',
});

module.exports = Adversaire;
