'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('channels', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      type: {
        type: Sequelize.ENUM('equipe', 'club', 'prive', 'groupe', 'dirigeants'),
        defaultValue: 'equipe'
      },
      club_id: { type: Sequelize.INTEGER },
      equipe_id: { type: Sequelize.INTEGER },
      membres: { type: Sequelize.JSON, defaultValue: [] },
      cree_par: { type: Sequelize.INTEGER },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('messages', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      channel_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'channels', key: 'id' }, onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      contenu: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM('texte', 'image', 'fichier', 'systeme'),
        defaultValue: 'texte'
      },
      fichier_url: { type: Sequelize.STRING(500) },
      lu_par: { type: Sequelize.JSON, defaultValue: [] },
      modifie: { type: Sequelize.BOOLEAN, defaultValue: false },
      supprime: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'convocation', 'match', 'message', 'resultat',
          'systeme', 'rappel', 'annulation'
        ),
        allowNull: false
      },
      titre: { type: Sequelize.STRING(200), allowNull: false },
      contenu: { type: Sequelize.TEXT, allowNull: false },
      lien: { type: Sequelize.STRING(500) },
      lu: { type: Sequelize.BOOLEAN, defaultValue: false },
      lu_at: { type: Sequelize.DATE },
      donnees: { type: Sequelize.JSON },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('notifications', ['user_id', 'lu']);
    await queryInterface.addIndex('messages', ['channel_id', 'created_at']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('channels');
  }
};
