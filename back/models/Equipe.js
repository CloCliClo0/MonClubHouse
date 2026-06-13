const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Equipe = sequelize.define('Equipe', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id:  { type: DataTypes.INTEGER, allowNull: false },
  sport_id: { type: DataTypes.INTEGER, allowNull: true },
  nom:         { type: DataTypes.STRING(200), allowNull: false },
  categorie_id:{ type: DataTypes.INTEGER, allowNull: true },
  niveau:      { type: DataTypes.STRING(50), allowNull: true },
  couleur:  { type: DataTypes.STRING(7), defaultValue: '#1b4332' },
  actif:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'equipes',
});

module.exports = Equipe;
