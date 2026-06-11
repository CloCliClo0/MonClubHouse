const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ArbitragePresence = sequelize.define('ArbitragePresence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  commentaire: { type: DataTypes.STRING(500), allowNull: true }
}, {
  tableName: 'arbitrage_presences',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['club_id', 'user_id', 'date'] }]
});

module.exports = ArbitragePresence;
