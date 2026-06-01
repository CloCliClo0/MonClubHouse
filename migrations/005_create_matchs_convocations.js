'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('matchs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      equipe_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'equipes', key: 'id' }, onDelete: 'CASCADE'
      },
      terrain_id: { type: Sequelize.INTEGER, references: { model: 'terrains', key: 'id' } },
      adversaire: { type: Sequelize.STRING(200) },
      date: { type: Sequelize.DATE, allowNull: false },
      lieu: { type: Sequelize.STRING(500) },
      type: {
        type: Sequelize.ENUM('match', 'entrainement', 'tournoi', 'amical', 'coupe'),
        defaultValue: 'match'
      },
      domicile_exterieur: {
        type: Sequelize.ENUM('domicile', 'exterieur', 'neutre'),
        defaultValue: 'domicile'
      },
      score_equipe: { type: Sequelize.INTEGER },
      score_adversaire: { type: Sequelize.INTEGER },
      statut: {
        type: Sequelize.ENUM('programme', 'en_cours', 'termine', 'annule', 'reporte'),
        defaultValue: 'programme'
      },
      description: { type: Sequelize.TEXT },
      rapport: { type: Sequelize.TEXT },
      heure_rdv: { type: Sequelize.TIME },
      championnat: { type: Sequelize.STRING(200) },
      journee: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('convocations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      match_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'matchs', key: 'id' }, onDelete: 'CASCADE'
      },
      joueur_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      statut: {
        type: Sequelize.ENUM('convoque', 'present', 'absent', 'incertain', 'non_retenu'),
        defaultValue: 'convoque'
      },
      reponse_at: { type: Sequelize.DATE },
      motif_absence: { type: Sequelize.STRING(500) },
      notifie: { type: Sequelize.BOOLEAN, defaultValue: false },
      notifie_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('compositions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      match_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'matchs', key: 'id' }, onDelete: 'CASCADE'
      },
      formation: { type: Sequelize.STRING(20), defaultValue: '4-3-3' },
      titulaires: { type: Sequelize.JSON },
      remplacants: { type: Sequelize.JSON },
      notes_tactiques: { type: Sequelize.TEXT },
      cree_par: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('compositions');
    await queryInterface.dropTable('convocations');
    await queryInterface.dropTable('matchs');
  }
};
