'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = await queryInterface.describeTable('matchs');
    if (!cols.besoin_arbitre) {
      await queryInterface.addColumn('matchs', 'besoin_arbitre', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('matchs', 'besoin_arbitre');
  },
};
