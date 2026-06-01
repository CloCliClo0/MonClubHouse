const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Convocation = sequelize.define('Convocation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  match_id: { type: DataTypes.INTEGER, allowNull: false },
  joueur_id: { type: DataTypes.INTEGER, allowNull: false },
  statut: {
    type: DataTypes.ENUM('convoque', 'present', 'absent', 'incertain', 'non_retenu'),
    defaultValue: 'convoque'
  },
  reponse_at: { type: DataTypes.DATE, allowNull: true },
  motif_absence: { type: DataTypes.STRING(500), allowNull: true },
  notifie: { type: DataTypes.BOOLEAN, defaultValue: false },
  notifie_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'convocations'
});

module.exports = Convocation;
