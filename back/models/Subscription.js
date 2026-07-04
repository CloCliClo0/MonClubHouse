const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Polymorphe : owner_type='club' (1 achat couvre tout le club) ou 'user' (achat individuel).
// Un club avec un abonnement 'club' actif dispense tous ses membres d'abonnement individuel.
const Subscription = sequelize.define('Subscription', {
  id:                     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  owner_type:             { type: DataTypes.ENUM('club', 'user'), allowNull: false },
  owner_id:               { type: DataTypes.INTEGER, allowNull: false },
  plan:                   { type: DataTypes.ENUM('mensuel', 'annuel'), allowNull: false },
  statut:                 { type: DataTypes.ENUM('actif', 'expire', 'annule', 'impaye'), allowNull: false, defaultValue: 'actif' },
  stripe_customer_id:     { type: DataTypes.STRING(100), allowNull: true },
  stripe_subscription_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  promo_code:             { type: DataTypes.STRING(30), allowNull: true },
  current_period_end:     { type: DataTypes.DATE, allowNull: true },
  rappel_envoye:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: false,
});

module.exports = Subscription;
