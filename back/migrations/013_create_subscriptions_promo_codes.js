'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promo_codes', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code:        { type: Sequelize.STRING(30), allowNull: false, unique: true },
      type:        { type: Sequelize.ENUM('percent', 'fixed'), allowNull: false, defaultValue: 'percent' },
      valeur:      { type: Sequelize.INTEGER, allowNull: false },
      description: { type: Sequelize.STRING(200), allowNull: true },
      max_uses:    { type: Sequelize.INTEGER, allowNull: true },
      uses_count:  { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      expires_at:  { type: Sequelize.DATE, allowNull: true },
      actif:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by:  { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('subscriptions', {
      id:                     { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      owner_type:             { type: Sequelize.ENUM('club', 'user'), allowNull: false },
      owner_id:               { type: Sequelize.INTEGER, allowNull: false },
      plan:                   { type: Sequelize.ENUM('mensuel', 'annuel'), allowNull: false },
      statut:                 { type: Sequelize.ENUM('actif', 'expire', 'annule', 'impaye'), allowNull: false, defaultValue: 'actif' },
      stripe_customer_id:     { type: Sequelize.STRING(100), allowNull: true },
      stripe_subscription_id: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      promo_code:             { type: Sequelize.STRING(30), allowNull: true },
      current_period_end:     { type: Sequelize.DATE, allowNull: true },
      rappel_envoye:          { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at:             { type: Sequelize.DATE, allowNull: false },
      updated_at:             { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('subscriptions', ['owner_type', 'owner_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('promo_codes');
  },
};
