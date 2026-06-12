const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Convocation = sequelize.define('Convocation', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  match_id:  { type: DataTypes.INTEGER, allowNull: false },
  joueur_id: { type: DataTypes.INTEGER, allowNull: false },
  club_id:   { type: DataTypes.INTEGER, allowNull: true },
  statut: {
    type: DataTypes.ENUM('convoque', 'present', 'absent', 'incertain'),
    defaultValue: 'convoque'
  },
  // DB column is `commentaire` — aliased as `motif_absence` for app consistency
  motif_absence: { type: DataTypes.TEXT, allowNull: true, field: 'commentaire' },
  email_envoye:  { type: DataTypes.BOOLEAN, defaultValue: false },
  reponse_at:    { type: DataTypes.DATE, allowNull: true },
  notifie:       { type: DataTypes.BOOLEAN, defaultValue: false },
  notifie_at:    { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'convocations'
});

module.exports = Convocation;
