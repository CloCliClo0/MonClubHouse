'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = await queryInterface.describeTable('match_events');
    if (!cols.passeur_id) {
      await queryInterface.addColumn('match_events', 'passeur_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('match_events', 'passeur_id');
  },
};
