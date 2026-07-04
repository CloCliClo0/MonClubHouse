const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PromoCode = sequelize.define('PromoCode', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:        { type: DataTypes.STRING(30), allowNull: false, unique: true },
  type:        { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false, defaultValue: 'percent' },
  valeur:      { type: DataTypes.INTEGER, allowNull: false }, // percent : 1-100 ; fixed : centimes
  description: { type: DataTypes.STRING(200), allowNull: true },
  max_uses:    { type: DataTypes.INTEGER, allowNull: true }, // null = illimité
  uses_count:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  expires_at:  { type: DataTypes.DATE, allowNull: true },
  actif:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_by:  { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'promo_codes',
});

module.exports = PromoCode;
