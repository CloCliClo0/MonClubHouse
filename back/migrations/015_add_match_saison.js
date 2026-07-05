'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const describe = await queryInterface.describeTable('matchs');
    if (!describe.saison) {
      await queryInterface.addColumn('matchs', 'saison', { type: Sequelize.STRING(20), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    try { await queryInterface.removeColumn('matchs', 'saison'); } catch {}
  },
};
