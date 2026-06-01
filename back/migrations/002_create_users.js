'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(100), allowNull: false },
      prenom: { type: Sequelize.STRING(100), defaultValue: '' },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255) },
      role: {
        type: Sequelize.ENUM('superadmin', 'admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur'),
        defaultValue: 'joueur'
      },
      club_id: {
        type: Sequelize.INTEGER,
        references: { model: 'clubs', key: 'id' },
        onDelete: 'SET NULL'
      },
      parent_id: { type: Sequelize.INTEGER },
      google_id: { type: Sequelize.STRING(255), unique: true },
      refresh_token: { type: Sequelize.TEXT },
      avatar: { type: Sequelize.STRING(500) },
      telephone: { type: Sequelize.STRING(20) },
      date_naissance: { type: Sequelize.DATEONLY },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      derniere_connexion: { type: Sequelize.DATE },
      notif_email: { type: Sequelize.BOOLEAN, defaultValue: true },
      notif_push: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['club_id']);
    await queryInterface.addIndex('users', ['role']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  }
};
