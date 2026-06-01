'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(100), allowNull: false },
      prenom: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: true },
      role: {
        type: Sequelize.ENUM('superadmin', 'admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur'),
        defaultValue: 'visiteur',
      },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clubs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      google_id: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      refresh_token: { type: Sequelize.TEXT, allowNull: true },
      avatar: { type: Sequelize.STRING(500), allowNull: true },
      telephone: { type: Sequelize.STRING(20), allowNull: true },
      date_naissance: { type: Sequelize.DATEONLY, allowNull: true },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      derniere_connexion: { type: Sequelize.DATE, allowNull: true },
      notif_email: { type: Sequelize.BOOLEAN, defaultValue: true },
      notif_push: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['club_id']);
    await queryInterface.addIndex('users', ['role']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
