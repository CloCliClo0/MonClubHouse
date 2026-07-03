'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = await queryInterface.describeTable('arbitrage_presences');
    if (!cols.match_id) {
      await queryInterface.addColumn('arbitrage_presences', 'match_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'matchs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('arbitrage_presences', 'match_id');
  },
};
