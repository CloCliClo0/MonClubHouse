const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PlayerVote = sequelize.define('PlayerVote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  match_id: { type: DataTypes.INTEGER, allowNull: false },
  club_id: { type: DataTypes.INTEGER, allowNull: false },
  voter_id: { type: DataTypes.INTEGER, allowNull: false },
  voted_for_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'player_votes',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['match_id', 'voter_id'] }]
});

module.exports = PlayerVote;
