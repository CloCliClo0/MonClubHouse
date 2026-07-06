'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const describe = await queryInterface.describeTable('clubs');
    if (!describe.slug) {
      await queryInterface.addColumn('clubs', 'slug', { type: Sequelize.STRING(220), allowNull: true, unique: true });
    }
  },
  down: async (queryInterface) => {
    try { await queryInterface.removeColumn('clubs', 'slug'); } catch {}
  },
};
