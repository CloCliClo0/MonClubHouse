'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const describe = await queryInterface.describeTable('equipes');
    if (!describe.genre) {
      await queryInterface.addColumn('equipes', 'genre', {
        type: Sequelize.ENUM('masculin', 'feminin', 'mixte', 'handisport'), allowNull: false, defaultValue: 'masculin',
      });
    }
    if (!describe.format) {
      await queryInterface.addColumn('equipes', 'format', { type: Sequelize.STRING(10), allowNull: false, defaultValue: '11' });
    }
    if (!describe.couleur_maillot) {
      await queryInterface.addColumn('equipes', 'couleur_maillot', { type: Sequelize.STRING(7), allowNull: false, defaultValue: '#0f5238' });
    }
    if (!describe.description) {
      await queryInterface.addColumn('equipes', 'description', { type: Sequelize.TEXT, allowNull: true });
    }
  },
  down: async (queryInterface) => {
    for (const col of ['genre', 'format', 'couleur_maillot', 'description']) {
      try { await queryInterface.removeColumn('equipes', col); } catch {}
    }
  },
};
