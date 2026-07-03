'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('support_tickets', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      club_id:     { type: Sequelize.INTEGER, allowNull: true,  references: { model: 'clubs', key: 'id' }, onDelete: 'SET NULL' },
      sujet:       { type: Sequelize.STRING(200), allowNull: false },
      message:     { type: Sequelize.TEXT, allowNull: false },
      priorite:    { type: Sequelize.ENUM('normal', 'haute', 'urgent'), defaultValue: 'normal' },
      statut:      { type: Sequelize.ENUM('ouvert', 'en_cours', 'resolu', 'ferme'), defaultValue: 'ouvert' },
      reponse:     { type: Sequelize.TEXT, allowNull: true },
      repondu_par: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('support_tickets', ['user_id']);
    await queryInterface.addIndex('support_tickets', ['statut', 'priorite']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('support_tickets');
  },
};
