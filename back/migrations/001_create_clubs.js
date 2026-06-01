'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clubs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      logo: { type: Sequelize.STRING(500) },
      description: { type: Sequelize.TEXT },
      adresse: { type: Sequelize.STRING(500) },
      ville: { type: Sequelize.STRING(100) },
      code_postal: { type: Sequelize.STRING(10) },
      telephone: { type: Sequelize.STRING(20) },
      email: { type: Sequelize.STRING(255) },
      site_web: { type: Sequelize.STRING(500) },
      reseaux_sociaux: { type: Sequelize.JSON },
      couleur_primaire: { type: Sequelize.STRING(7), defaultValue: '#2d6a4f' },
      couleur_secondaire: { type: Sequelize.STRING(7), defaultValue: '#ffffff' },
      numero_affiliation: { type: Sequelize.STRING(50) },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('clubs');
  }
};
