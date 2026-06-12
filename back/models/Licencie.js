const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Licencie = sequelize.define('Licencie', {
  id:                    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:               { type: DataTypes.INTEGER, allowNull: false },
  equipe_id:             { type: DataTypes.INTEGER, allowNull: true },
  club_id:               { type: DataTypes.INTEGER, allowNull: true },
  numero_licence:        { type: DataTypes.STRING(50), allowNull: true, unique: true },
  poste:                 { type: DataTypes.STRING(50), allowNull: true },
  numero_maillot:        { type: DataTypes.INTEGER, allowNull: true },
  pied_fort:             { type: DataTypes.ENUM('droit', 'gauche', 'ambidextre'), allowNull: true },
  statut:                { type: DataTypes.ENUM('actif', 'inactif', 'suspendu', 'blesse'), defaultValue: 'actif' },
  date_expiration_licence: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: 'licencies',
});

module.exports = Licencie;
