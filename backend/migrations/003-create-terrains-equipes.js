'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('terrains', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clubs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      adresse: { type: Sequelize.STRING(500), allowNull: true },
      capacite: { type: Sequelize.INTEGER, allowNull: true },
      type_surface: { type: Sequelize.STRING(50), allowNull: true },
      eclairage: { type: Sequelize.BOOLEAN, defaultValue: false },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('equipes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clubs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sport_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sports', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      categorie: { type: Sequelize.STRING(50), allowNull: false },
      genre: { type: Sequelize.ENUM('masculin', 'feminin', 'mixte'), defaultValue: 'masculin' },
      saison: { type: Sequelize.STRING(9), allowNull: false },
      coach_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      couleur_maillot: { type: Sequelize.STRING(7), allowNull: true },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('licencies', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      equipe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'equipes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clubs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      numero_licence: { type: Sequelize.STRING(50), allowNull: true },
      poste: { type: Sequelize.STRING(50), allowNull: true },
      numero_maillot: { type: Sequelize.INTEGER, allowNull: true },
      date_inscription: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('licencies', ['user_id', 'equipe_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('licencies');
    await queryInterface.dropTable('equipes');
    await queryInterface.dropTable('terrains');
  },
};
