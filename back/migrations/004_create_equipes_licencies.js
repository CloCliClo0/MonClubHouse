'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('equipes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      club_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'clubs', key: 'id' }, onDelete: 'CASCADE'
      },
      sport_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'sports', key: 'id' }
      },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      categorie: {
        type: Sequelize.ENUM(
          'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14',
          'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21',
          'Senior', 'Veteran', 'Loisir'
        ),
        allowNull: false
      },
      genre: {
        type: Sequelize.ENUM('masculin', 'feminin', 'mixte', 'handisport'),
        defaultValue: 'masculin'
      },
      format: {
        type: Sequelize.ENUM('4', '5', '7', '8', '11', '15', 'autre'),
        defaultValue: '11'
      },
      couleur_maillot: { type: Sequelize.STRING(7) },
      coach_id: { type: Sequelize.INTEGER },
      description: { type: Sequelize.TEXT },
      actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('licencies', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      equipe_id: {
        type: Sequelize.INTEGER,
        references: { model: 'equipes', key: 'id' }, onDelete: 'SET NULL'
      },
      numero_licence: { type: Sequelize.STRING(50), unique: true },
      poste: { type: Sequelize.STRING(50) },
      numero_maillot: { type: Sequelize.INTEGER },
      pied_fort: { type: Sequelize.ENUM('droit', 'gauche', 'ambidextre') },
      statut: {
        type: Sequelize.ENUM('actif', 'inactif', 'suspendu', 'blesse'),
        defaultValue: 'actif'
      },
      date_inscription: { type: Sequelize.DATEONLY },
      date_expiration_licence: { type: Sequelize.DATEONLY },
      certificat_medical: { type: Sequelize.DATEONLY },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('licencies');
    await queryInterface.dropTable('equipes');
  }
};
