'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');

    if (!tableInfo.poste) {
      await queryInterface.addColumn('users', 'poste', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'notif_push',
      });
    }
    if (!tableInfo.pied_fort) {
      await queryInterface.addColumn('users', 'pied_fort', {
        type: Sequelize.ENUM('droit', 'gauche', 'ambidextre'),
        allowNull: true,
        after: 'poste',
      });
    }
    if (!tableInfo.taille) {
      await queryInterface.addColumn('users', 'taille', {
        type: Sequelize.INTEGER,
        allowNull: true,
        after: 'pied_fort',
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'taille');
  }
};
