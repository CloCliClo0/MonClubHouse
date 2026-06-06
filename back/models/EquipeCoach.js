const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EquipeCoach = sequelize.define('EquipeCoach', {
  equipe_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  user_id:   { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
}, {
  tableName: 'equipe_coachs',
  timestamps: false,
});

module.exports = EquipeCoach;
