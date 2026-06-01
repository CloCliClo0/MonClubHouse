'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      icone: { type: Sequelize.STRING(100) },
      nb_joueurs_equipe: { type: Sequelize.INTEGER, defaultValue: 11 },
      categories_age: { type: Sequelize.JSON },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('terrains', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clubs', key: 'id' },
        onDelete: 'CASCADE'
      },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      type: {
        type: Sequelize.ENUM('gazon_naturel', 'gazon_synthetique', 'salle', 'gymnase', 'piste', 'autre'),
        defaultValue: 'gazon_naturel'
      },
      capacite: { type: Sequelize.INTEGER },
      adresse: { type: Sequelize.STRING(500) },
      description: { type: Sequelize.TEXT },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Seed sports par défaut
    await queryInterface.bulkInsert('sports', [
      { nom: 'Football', icone: 'soccer-ball', nb_joueurs_equipe: 11, actif: true, created_at: new Date(), updated_at: new Date() },
      { nom: 'Futsal', icone: 'futsal', nb_joueurs_equipe: 5, actif: true, created_at: new Date(), updated_at: new Date() },
      { nom: 'Rugby', icone: 'rugby-ball', nb_joueurs_equipe: 15, actif: true, created_at: new Date(), updated_at: new Date() },
      { nom: 'Basketball', icone: 'basketball', nb_joueurs_equipe: 5, actif: true, created_at: new Date(), updated_at: new Date() },
      { nom: 'Handball', icone: 'handball', nb_joueurs_equipe: 7, actif: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('terrains');
    await queryInterface.dropTable('sports');
  }
};
