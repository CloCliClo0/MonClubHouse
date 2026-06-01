'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clubs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      logo: { type: Sequelize.STRING(500), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      adresse: { type: Sequelize.STRING(500), allowNull: true },
      ville: { type: Sequelize.STRING(100), allowNull: true },
      code_postal: { type: Sequelize.STRING(10), allowNull: true },
      telephone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      site_web: { type: Sequelize.STRING(500), allowNull: true },
      reseaux_sociaux: { type: Sequelize.JSON, defaultValue: '{}' },
      couleur_primaire: { type: Sequelize.STRING(7), defaultValue: '#2d6a4f' },
      couleur_secondaire: { type: Sequelize.STRING(7), defaultValue: '#ffffff' },
      numero_affiliation: { type: Sequelize.STRING(50), allowNull: true },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('sports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      icone: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.bulkInsert('sports', [
      { nom: 'Football', code: 'foot', icone: 'football', created_at: new Date(), updated_at: new Date() },
      { nom: 'Basketball', code: 'basket', icone: 'basketball', created_at: new Date(), updated_at: new Date() },
      { nom: 'Handball', code: 'hand', icone: 'handball', created_at: new Date(), updated_at: new Date() },
      { nom: 'Volleyball', code: 'volley', icone: 'volleyball', created_at: new Date(), updated_at: new Date() },
      { nom: 'Rugby', code: 'rugby', icone: 'rugby', created_at: new Date(), updated_at: new Date() },
      { nom: 'Tennis', code: 'tennis', icone: 'tennis', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sports');
    await queryInterface.dropTable('clubs');
  },
};
