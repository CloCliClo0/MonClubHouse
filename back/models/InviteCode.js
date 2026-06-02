const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InviteCode = sequelize.define('InviteCode', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:       { type: DataTypes.STRING(30), allowNull: false, unique: true },
  equipe_id:  { type: DataTypes.INTEGER, allowNull: false },
  club_id:    { type: DataTypes.INTEGER, allowNull: false },
  role:       { type: DataTypes.ENUM('joueur', 'parent'), defaultValue: 'joueur' },
  label:      { type: DataTypes.STRING(100), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  max_uses:   { type: DataTypes.INTEGER, defaultValue: 50 },
  uses_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  actif:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'invite_codes' });

module.exports = InviteCode;
