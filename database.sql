-- ============================================================
--  MonClubHouse — Structure complète de la base de données
--  À importer dans phpMyAdmin (Hostinger)
--  Encodage : utf8mb4
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. CLUBS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clubs` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `nom`                VARCHAR(200) NOT NULL,
  `logo`               VARCHAR(500) DEFAULT NULL,
  `description`        TEXT         DEFAULT NULL,
  `adresse`            VARCHAR(500) DEFAULT NULL,
  `ville`              VARCHAR(100) DEFAULT NULL,
  `code_postal`        VARCHAR(10)  DEFAULT NULL,
  `telephone`          VARCHAR(20)  DEFAULT NULL,
  `email`              VARCHAR(255) DEFAULT NULL,
  `site_web`           VARCHAR(500) DEFAULT NULL,
  `reseaux_sociaux`    JSON         DEFAULT NULL,
  `couleur_primaire`   VARCHAR(7)   DEFAULT '#2d6a4f',
  `couleur_secondaire` VARCHAR(7)   DEFAULT '#ffffff',
  `numero_affiliation` VARCHAR(50)  DEFAULT NULL,
  `actif`              TINYINT(1)   DEFAULT 1,
  `created_at`         DATETIME     NOT NULL,
  `updated_at`         DATETIME     NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `nom`               VARCHAR(100) NOT NULL,
  `prenom`            VARCHAR(100) DEFAULT '',
  `email`             VARCHAR(255) NOT NULL,
  `password_hash`     VARCHAR(255) DEFAULT NULL,
  `role`              ENUM('superadmin','admin','dirigeant','coach','joueur','parent','visiteur') DEFAULT 'joueur',
  `club_id`           INT          DEFAULT NULL,
  `parent_id`         INT          DEFAULT NULL,
  `google_id`         VARCHAR(255) DEFAULT NULL,
  `refresh_token`     TEXT         DEFAULT NULL,
  `avatar`            VARCHAR(500) DEFAULT NULL,
  `telephone`         VARCHAR(20)  DEFAULT NULL,
  `date_naissance`    DATE         DEFAULT NULL,
  `actif`             TINYINT(1)   DEFAULT 1,
  `derniere_connexion` DATETIME    DEFAULT NULL,
  `notif_email`       TINYINT(1)   DEFAULT 1,
  `notif_push`        TINYINT(1)   DEFAULT 1,
  `created_at`        DATETIME     NOT NULL,
  `updated_at`        DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_google_id_unique` (`google_id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_club_id` (`club_id`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `fk_users_club` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. SPORTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sports` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `nom`                VARCHAR(100) NOT NULL,
  `icone`              VARCHAR(100) DEFAULT NULL,
  `nb_joueurs_equipe`  INT          DEFAULT 11,
  `categories_age`     JSON         DEFAULT NULL,
  `actif`              TINYINT(1)   DEFAULT 1,
  `created_at`         DATETIME     NOT NULL,
  `updated_at`         DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sports_nom_unique` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- 4. TERRAINS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `terrains` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `club_id`     INT          NOT NULL,
  `nom`         VARCHAR(200) NOT NULL,
  `type`        ENUM('gazon_naturel','gazon_synthetique','salle','gymnase','piste','autre') DEFAULT 'gazon_naturel',
  `capacite`    INT          DEFAULT NULL,
  `adresse`     VARCHAR(500) DEFAULT NULL,
  `description` TEXT         DEFAULT NULL,
  `actif`       TINYINT(1)   DEFAULT 1,
  `created_at`  DATETIME     NOT NULL,
  `updated_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_terrains_club` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. EQUIPES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipes` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `club_id`        INT          NOT NULL,
  `sport_id`       INT          NOT NULL,
  `nom`            VARCHAR(200) NOT NULL,
  `categorie`      ENUM('U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U20','U21','Senior','Veteran','Loisir') NOT NULL,
  `genre`          ENUM('masculin','feminin','mixte','handisport') DEFAULT 'masculin',
  `format`         ENUM('4','5','7','8','11','15','autre') DEFAULT '11',
  `couleur_maillot` VARCHAR(7)  DEFAULT NULL,
  `coach_id`       INT          DEFAULT NULL,
  `description`    TEXT         DEFAULT NULL,
  `actif`          TINYINT(1)   DEFAULT 1,
  `created_at`     DATETIME     NOT NULL,
  `updated_at`     DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_equipes_club`  FOREIGN KEY (`club_id`)  REFERENCES `clubs`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_equipes_sport` FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. LICENCIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `licencies` (
  `id`                       INT         NOT NULL AUTO_INCREMENT,
  `user_id`                  INT         NOT NULL,
  `equipe_id`                INT         DEFAULT NULL,
  `numero_licence`           VARCHAR(50) DEFAULT NULL,
  `poste`                    VARCHAR(50) DEFAULT NULL,
  `numero_maillot`           INT         DEFAULT NULL,
  `pied_fort`                ENUM('droit','gauche','ambidextre') DEFAULT NULL,
  `statut`                   ENUM('actif','inactif','suspendu','blesse') DEFAULT 'actif',
  `date_inscription`         DATE        DEFAULT NULL,
  `date_expiration_licence`  DATE        DEFAULT NULL,
  `certificat_medical`       DATE        DEFAULT NULL,
  `notes`                    TEXT        DEFAULT NULL,
  `created_at`               DATETIME    NOT NULL,
  `updated_at`               DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `licencies_numero_unique` (`numero_licence`),
  CONSTRAINT `fk_licencies_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_licencies_equipe` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. MATCHS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matchs` (
  `id`                  INT          NOT NULL AUTO_INCREMENT,
  `equipe_id`           INT          NOT NULL,
  `terrain_id`          INT          DEFAULT NULL,
  `adversaire`          VARCHAR(200) DEFAULT NULL,
  `date`                DATETIME     NOT NULL,
  `lieu`                VARCHAR(500) DEFAULT NULL,
  `type`                ENUM('match','entrainement','tournoi','amical','coupe') DEFAULT 'match',
  `domicile_exterieur`  ENUM('domicile','exterieur','neutre') DEFAULT 'domicile',
  `score_equipe`        INT          DEFAULT NULL,
  `score_adversaire`    INT          DEFAULT NULL,
  `statut`              ENUM('programme','en_cours','termine','annule','reporte') DEFAULT 'programme',
  `description`         TEXT         DEFAULT NULL,
  `rapport`             TEXT         DEFAULT NULL,
  `heure_rdv`           TIME         DEFAULT NULL,
  `championnat`         VARCHAR(200) DEFAULT NULL,
  `journee`             INT          DEFAULT NULL,
  `created_at`          DATETIME     NOT NULL,
  `updated_at`          DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_matchs_equipe`  FOREIGN KEY (`equipe_id`)  REFERENCES `equipes`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_matchs_terrain` FOREIGN KEY (`terrain_id`) REFERENCES `terrains` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. CONVOCATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `convocations` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `match_id`      INT          NOT NULL,
  `joueur_id`     INT          NOT NULL,
  `statut`        ENUM('convoque','present','absent','incertain','non_retenu') DEFAULT 'convoque',
  `reponse_at`    DATETIME     DEFAULT NULL,
  `motif_absence` VARCHAR(500) DEFAULT NULL,
  `notifie`       TINYINT(1)   DEFAULT 0,
  `notifie_at`    DATETIME     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL,
  `updated_at`    DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_convocations_match`  FOREIGN KEY (`match_id`)  REFERENCES `matchs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_convocations_joueur` FOREIGN KEY (`joueur_id`) REFERENCES `users`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. COMPOSITIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `compositions` (
  `id`             INT         NOT NULL AUTO_INCREMENT,
  `match_id`       INT         NOT NULL,
  `formation`      VARCHAR(20) DEFAULT '4-3-3',
  `titulaires`     JSON        DEFAULT NULL,
  `remplacants`    JSON        DEFAULT NULL,
  `notes_tactiques` TEXT       DEFAULT NULL,
  `cree_par`       INT         DEFAULT NULL,
  `created_at`     DATETIME    NOT NULL,
  `updated_at`     DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `compositions_match_unique` (`match_id`),
  CONSTRAINT `fk_compositions_match` FOREIGN KEY (`match_id`) REFERENCES `matchs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. CHANNELS (Chat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `channels` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `nom`       VARCHAR(200) NOT NULL,
  `type`      ENUM('equipe','club','prive','groupe','dirigeants') DEFAULT 'equipe',
  `club_id`   INT          DEFAULT NULL,
  `equipe_id` INT          DEFAULT NULL,
  `membres`   JSON         DEFAULT NULL,
  `cree_par`  INT          DEFAULT NULL,
  `actif`     TINYINT(1)   DEFAULT 1,
  `created_at` DATETIME    NOT NULL,
  `updated_at` DATETIME    NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `channel_id`  INT          NOT NULL,
  `sender_id`   INT          NOT NULL,
  `contenu`     TEXT         NOT NULL,
  `type`        ENUM('texte','image','fichier','systeme') DEFAULT 'texte',
  `fichier_url` VARCHAR(500) DEFAULT NULL,
  `lu_par`      JSON         DEFAULT NULL,
  `modifie`     TINYINT(1)   DEFAULT 0,
  `supprime`    TINYINT(1)   DEFAULT 0,
  `created_at`  DATETIME     NOT NULL,
  `updated_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_channel_date` (`channel_id`, `created_at`),
  CONSTRAINT `fk_messages_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender`  FOREIGN KEY (`sender_id`)  REFERENCES `users`    (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `type`       ENUM('convocation','match','message','resultat','systeme','rappel','annulation') NOT NULL,
  `titre`      VARCHAR(200) NOT NULL,
  `contenu`    TEXT         NOT NULL,
  `lien`       VARCHAR(500) DEFAULT NULL,
  `lu`         TINYINT(1)   DEFAULT 0,
  `lu_at`      DATETIME     DEFAULT NULL,
  `donnees`    JSON         DEFAULT NULL,
  `created_at` DATETIME     NOT NULL,
  `updated_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_lu` (`user_id`, `lu`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. TABLE MIGRATIONS SEQUELIZE (pour que Sequelize sache que
--     les migrations ont déjà été appliquées)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES
('001_create_clubs.js'),
('002_create_users.js'),
('003_create_sports_terrains.js'),
('004_create_equipes_licencies.js'),
('005_create_matchs_convocations.js'),
('006_create_chat_notifications.js'),
('007_create_invite_codes.js');

-- ------------------------------------------------------------
-- 14. CODES D'INVITATION (accès par catégorie/équipe)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invite_codes` (
  `id`          INT         NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(30) NOT NULL,
  `equipe_id`   INT         NOT NULL,
  `club_id`     INT         NOT NULL,
  `role`        ENUM('joueur','parent','coach','dirigeant') NOT NULL DEFAULT 'joueur',
  `label`       VARCHAR(100) DEFAULT NULL,
  `created_by`  INT         DEFAULT NULL,
  `max_uses`    INT         DEFAULT 50,
  `uses_count`  INT         DEFAULT 0,
  `expires_at`  DATETIME    DEFAULT NULL,
  `actif`       TINYINT(1)  DEFAULT 1,
  `created_at`  DATETIME    NOT NULL,
  `updated_at`  DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_codes_code_unique` (`code`),
  KEY `idx_invite_code_actif` (`code`, `actif`),
  CONSTRAINT `fk_invite_equipe`   FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invite_club`     FOREIGN KEY (`club_id`)   REFERENCES `clubs`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invite_creator`  FOREIGN KEY (`created_by`) REFERENCES `users`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. COMPTE SUPERADMIN — Hugo Delaunay
--     Mot de passe : Hugo220406@  (bcrypt 12 rounds)
--     Utilise ON DUPLICATE KEY pour ne pas écraser si déjà créé.
-- ------------------------------------------------------------
INSERT INTO `users`
  (`nom`, `prenom`, `email`, `password_hash`, `role`, `actif`, `created_at`, `updated_at`)
VALUES
  ('Delaunay', 'Hugo', 'hugo22042006@gmail.com',
   '$2a$12$i6U6aJMeha1xhI9qX3.v5.B.sACIpGcQqK4J4BVYVlavHKshlLLAm',
   'superadmin', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `role`          = 'superadmin',
  `password_hash` = '$2a$12$i6U6aJMeha1xhI9qX3.v5.B.sACIpGcQqK4J4BVYVlavHKshlLLAm',
  `updated_at`    = NOW();


SET FOREIGN_KEY_CHECKS = 1;
