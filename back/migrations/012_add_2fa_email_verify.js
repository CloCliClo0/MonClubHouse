'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const describe = (table) => queryInterface.describeTable(table);

    const usersDesc = await describe('users');

    const addIfMissing = async (table, column, definition) => {
      const desc = await describe(table);
      if (!desc[column]) {
        await queryInterface.addColumn(table, column, definition);
      }
    };

    await addIfMissing('users', 'email_verified',      { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false });
    await addIfMissing('users', 'email_verify_token',  { type: Sequelize.STRING(64), allowNull: true });
    await addIfMissing('users', 'email_verify_expires',{ type: Sequelize.DATE, allowNull: true });
    await addIfMissing('users', 'two_fa_enabled',      { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false });
    await addIfMissing('users', 'two_fa_code',         { type: Sequelize.STRING(6), allowNull: true });
    await addIfMissing('users', 'two_fa_expires',      { type: Sequelize.DATE, allowNull: true });
  },

  down: async (queryInterface) => {
    const drop = async (table, column) => {
      try { await queryInterface.removeColumn(table, column); } catch {}
    };
    await drop('users', 'email_verified');
    await drop('users', 'email_verify_token');
    await drop('users', 'email_verify_expires');
    await drop('users', 'two_fa_enabled');
    await drop('users', 'two_fa_code');
    await drop('users', 'two_fa_expires');
  },
};
