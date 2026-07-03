const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SupportTicket = sequelize.define('SupportTicket', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false },
  club_id:     { type: DataTypes.INTEGER, allowNull: true },
  sujet:       { type: DataTypes.STRING(200), allowNull: false },
  message:     { type: DataTypes.TEXT, allowNull: false },
  priorite:    { type: DataTypes.ENUM('normal', 'haute', 'urgent'), defaultValue: 'normal' },
  statut:      { type: DataTypes.ENUM('ouvert', 'en_cours', 'resolu', 'ferme'), defaultValue: 'ouvert' },
  reponse:     { type: DataTypes.TEXT, allowNull: true },
  repondu_par: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'support_tickets',
  timestamps: true,
  underscored: false,
});

module.exports = SupportTicket;
