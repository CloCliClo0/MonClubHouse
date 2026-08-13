-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 12, 2026 at 11:29 AM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u555371370_mch_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `adversaires`
--

CREATE TABLE `adversaires` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `categorie` varchar(50) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `couleur` varchar(7) DEFAULT '#1b4332',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adversaires`
--

INSERT INTO `adversaires` (`id`, `club_id`, `nom`, `categorie`, `ville`, `contact`, `telephone`, `couleur`, `created_at`, `updated_at`) VALUES
(2, 1, 'TEST', 'Seniors', 'TEST', NULL, NULL, '#dc2626', '2026-07-05 08:18:53', '2026-07-05 08:18:53');

-- --------------------------------------------------------

--
-- Table structure for table `arbitrage_presences`
--

CREATE TABLE `arbitrage_presences` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `commentaire` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `match_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `couleur` varchar(7) DEFAULT '#1b4332',
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `club_id`, `nom`, `couleur`, `actif`, `created_at`, `updated_at`) VALUES
(1, 1, 'Senior', '#1b4332', 1, '2026-06-14 09:36:07', '2026-06-14 09:36:07'),
(2, 1, 'Vétéran', '#1a2442', 1, '2026-07-04 15:22:36', '2026-07-04 15:22:36');

-- --------------------------------------------------------

--
-- Table structure for table `channels`
--

CREATE TABLE `channels` (
  `id` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `type` enum('equipe','club','prive','groupe','dirigeants') DEFAULT 'equipe',
  `club_id` int(11) DEFAULT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `membres` longtext DEFAULT NULL,
  `cree_par` int(11) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `channels`
--

INSERT INTO `channels` (`id`, `nom`, `type`, `club_id`, `equipe_id`, `membres`, `cree_par`, `actif`, `created_at`, `updated_at`) VALUES
(1, 'Senior', 'equipe', 1, NULL, '[2]', 2, 1, '2026-06-14 09:57:40', '2026-06-14 09:57:40');

-- --------------------------------------------------------

--
-- Table structure for table `ch_equipes`
--

CREATE TABLE `ch_equipes` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `equipe_ref_id` int(11) NOT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `saison` varchar(20) NOT NULL,
  `championnat` varchar(200) DEFAULT NULL,
  `couleur` varchar(7) DEFAULT '#6c757d',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `ch_equipes`
--

INSERT INTO `ch_equipes` (`id`, `club_id`, `equipe_ref_id`, `equipe_id`, `nom`, `saison`, `championnat`, `couleur`, `created_at`, `updated_at`) VALUES
(4, 1, 4, 4, 'Senior A', '2025-2026', 'Phase 1', '#1b4332', '2026-07-05 09:29:59', '2026-07-05 09:29:59'),
(5, 1, 4, 4, 'Senior A', '2026-2027', 'Phase 1', '#1b4332', '2026-07-05 09:30:19', '2026-07-05 09:30:19'),
(6, 1, 4, NULL, 'TEST', '2025-2026', 'Phase 1', '#1b4332', '2026-07-05 12:13:37', '2026-07-05 12:13:37');

-- --------------------------------------------------------

--
-- Table structure for table `ch_matchs`
--

CREATE TABLE `ch_matchs` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `equipe_ref_id` int(11) NOT NULL,
  `dom_id` int(11) NOT NULL,
  `ext_id` int(11) NOT NULL,
  `journee` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `score_dom` int(11) DEFAULT NULL,
  `score_ext` int(11) DEFAULT NULL,
  `saison` varchar(20) NOT NULL,
  `championnat` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clubs`
--

CREATE TABLE `clubs` (
  `id` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `site_web` varchar(255) DEFAULT NULL,
  `reseaux_sociaux` longtext DEFAULT NULL,
  `couleur_primaire` varchar(7) DEFAULT '#1b4332',
  `couleur_secondaire` varchar(7) DEFAULT '#000000',
  `numero_affiliation` varchar(50) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `slug` varchar(220) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clubs`
--

INSERT INTO `clubs` (`id`, `nom`, `logo`, `description`, `adresse`, `ville`, `code_postal`, `telephone`, `email`, `site_web`, `reseaux_sociaux`, `couleur_primaire`, `couleur_secondaire`, `numero_affiliation`, `actif`, `created_at`, `updated_at`, `slug`) VALUES
(1, 'FC Le Doulieu', 'https://drive.google.com/thumbnail?id=1T1idFITmVsYY0MOEFdV06lWwH7W1CQls&sz=w1000', 'Club de football multisports fondé en 1987.', ' 1 Rue du calvaire, Le Doulieu, France, 59940', 'Le Doulieu', '59940', '06 18 38 66 99', ' jourdain.bertrand@wanadoo.fr', 'https://www.onivo-equipements.fr/fc-ledoulieu https://www.facebook.com/fcledoulieuofficiel/?locale=fr_FR', NULL, '#1253d3', '#000000', NULL, 1, '2026-06-02 18:08:34', '2026-07-06 21:25:24', 'fc-le-doulieu');

-- --------------------------------------------------------

--
-- Table structure for table `compositions`
--

CREATE TABLE `compositions` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `formation` varchar(20) DEFAULT '4-3-3',
  `joueurs` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `convocations`
--

CREATE TABLE `convocations` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `joueur_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `statut` enum('convoque','present','absent','incertain') DEFAULT 'convoque',
  `commentaire` text DEFAULT NULL,
  `email_envoye` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reponse_at` datetime DEFAULT NULL,
  `notifie` tinyint(1) DEFAULT 0,
  `notifie_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `convocations`
--

INSERT INTO `convocations` (`id`, `match_id`, `joueur_id`, `club_id`, `statut`, `commentaire`, `email_envoye`, `created_at`, `updated_at`, `reponse_at`, `notifie`, `notifie_at`) VALUES
(1, 1, 2, 0, 'present', NULL, 0, '2026-06-30 17:33:02', '2026-06-30 20:09:28', '2026-06-30 20:09:28', 1, '2026-06-30 17:33:07'),
(2, 6, 3, 0, 'present', NULL, 0, '2026-07-05 17:09:04', '2026-07-05 17:11:30', '2026-07-05 17:11:30', 1, '2026-07-05 17:09:14');

-- --------------------------------------------------------

--
-- Table structure for table `equipes`
--

CREATE TABLE `equipes` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `sport_id` int(11) DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `categorie` varchar(50) DEFAULT NULL,
  `niveau` varchar(50) DEFAULT NULL,
  `couleur` varchar(7) DEFAULT '#1b4332',
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `categorie_id` int(11) DEFAULT NULL,
  `genre` enum('masculin','feminin','mixte','handisport') NOT NULL DEFAULT 'masculin',
  `format` varchar(10) NOT NULL DEFAULT '11',
  `couleur_maillot` varchar(7) NOT NULL DEFAULT '#0f5238',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipes`
--

INSERT INTO `equipes` (`id`, `club_id`, `sport_id`, `nom`, `categorie`, `niveau`, `couleur`, `actif`, `created_at`, `updated_at`, `categorie_id`, `genre`, `format`, `couleur_maillot`, `description`) VALUES
(2, 1, NULL, 'Senior A', 'Senior', 'D2', '#1b4332', 0, '2026-06-13 08:41:38', '2026-07-04 14:27:16', NULL, 'masculin', '11', '#0f5238', NULL),
(3, 1, NULL, 'Senior B', 'Senior', 'D4', '#1b4332', 0, '2026-06-13 08:42:00', '2026-07-04 14:27:22', NULL, 'masculin', '11', '#0f5238', NULL),
(4, 1, 1, 'Senior A', NULL, 'D2', '#1b4332', 1, '2026-06-14 09:42:33', '2026-06-14 09:42:33', 1, 'masculin', '11', '#0f5238', NULL),
(5, 1, 1, 'Senior B', NULL, 'D4', '#1b4332', 0, '2026-06-14 09:42:48', '2026-07-04 14:27:06', 1, 'masculin', '11', '#0f5238', NULL),
(6, 1, 1, 'Senior B', NULL, NULL, '#1b4332', 1, '2026-07-04 14:27:35', '2026-07-04 14:27:35', 1, 'masculin', '11', '#0f5238', NULL),
(7, 1, 1, 'Vétéran A', NULL, NULL, '#1b4332', 1, '2026-07-04 15:25:33', '2026-07-04 15:25:33', 2, 'masculin', '11', '#0f5238', NULL),
(8, 1, 1, '__diag_test_updated__', NULL, NULL, '#1b4332', 0, '2026-07-05 16:45:54', '2026-07-05 16:45:54', NULL, 'masculin', '11', '#0f5238', NULL),
(9, 1, 1, '__diag_test_updated__', NULL, NULL, '#1b4332', 0, '2026-07-09 06:05:30', '2026-07-09 06:05:30', NULL, 'masculin', '11', '#0f5238', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `equipe_coachs`
--

CREATE TABLE `equipe_coachs` (
  `id` int(11) NOT NULL,
  `equipe_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipe_coachs`
--

INSERT INTO `equipe_coachs` (`id`, `equipe_id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 5, 2, '2026-06-14 09:56:19', '2026-06-14 09:56:19'),
(4, 5, 3, '2026-06-30 17:04:39', '2026-06-30 17:04:39'),
(6, 5, 4, '2026-07-02 19:12:29', '2026-07-02 19:12:29'),
(8, 6, 3, '2026-07-04 16:23:13', '2026-07-04 16:23:13'),
(9, 4, 3, '2026-07-04 16:23:23', '2026-07-04 16:23:23'),
(10, 4, 3, '2026-07-04 20:29:31', '2026-07-04 20:29:31'),
(11, 6, 3, '2026-07-04 20:29:31', '2026-07-04 20:29:31'),
(12, 4, 3, '2026-07-04 20:29:32', '2026-07-04 20:29:32'),
(13, 6, 3, '2026-07-04 20:29:32', '2026-07-04 20:29:32'),
(14, 4, 3, '2026-07-04 20:29:38', '2026-07-04 20:29:38'),
(15, 6, 3, '2026-07-04 20:29:38', '2026-07-04 20:29:38'),
(16, 7, 3, '2026-07-04 20:29:43', '2026-07-04 20:29:43'),
(17, 4, 4, '2026-07-04 20:29:50', '2026-07-04 20:29:50'),
(18, 6, 4, '2026-07-04 20:29:50', '2026-07-04 20:29:50'),
(19, 4, 4, '2026-07-04 20:30:57', '2026-07-04 20:30:57'),
(20, 6, 4, '2026-07-04 20:30:57', '2026-07-04 20:30:57'),
(21, 4, 3, '2026-07-04 20:31:03', '2026-07-04 20:31:03'),
(22, 6, 3, '2026-07-04 20:31:03', '2026-07-04 20:31:03'),
(23, 4, 2, '2026-07-05 10:40:26', '2026-07-05 10:40:26'),
(24, 6, 2, '2026-07-05 10:40:26', '2026-07-05 10:40:26'),
(25, 4, 4, '2026-07-05 16:02:04', '2026-07-05 16:02:04'),
(26, 6, 4, '2026-07-05 16:02:04', '2026-07-05 16:02:04'),
(27, 4, 5, '2026-07-05 16:47:14', '2026-07-05 16:47:14'),
(28, 6, 5, '2026-07-05 16:47:14', '2026-07-05 16:47:14'),
(29, 4, 5, '2026-07-05 20:38:36', '2026-07-05 20:38:36'),
(30, 6, 5, '2026-07-05 20:38:36', '2026-07-05 20:38:36'),
(31, 4, 2, '2026-07-06 08:31:10', '2026-07-06 08:31:10'),
(32, 6, 2, '2026-07-06 08:31:10', '2026-07-06 08:31:10'),
(33, 4, 28, '2026-08-05 07:06:16', '2026-08-05 07:06:16'),
(34, 6, 28, '2026-08-05 07:06:16', '2026-08-05 07:06:16'),
(35, 4, 28, '2026-08-05 15:44:33', '2026-08-05 15:44:33'),
(36, 6, 28, '2026-08-05 15:44:33', '2026-08-05 15:44:33'),
(37, 4, 6, '2026-08-05 15:45:43', '2026-08-05 15:45:43'),
(38, 6, 6, '2026-08-05 15:45:43', '2026-08-05 15:45:43');

-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE `follows` (
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `status` enum('pending','accepted') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invite_codes`
--

CREATE TABLE `invite_codes` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `role` enum('admin','dirigeant','coach','joueur','parent') NOT NULL DEFAULT 'joueur',
  `uses_count` int(11) DEFAULT 0,
  `max_uses` int(11) DEFAULT 50,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `equipe_id` int(11) DEFAULT NULL,
  `categorie` varchar(50) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invite_codes`
--

INSERT INTO `invite_codes` (`id`, `club_id`, `code`, `role`, `uses_count`, `max_uses`, `actif`, `created_at`, `updated_at`, `equipe_id`, `categorie`, `label`, `created_by`, `expires_at`) VALUES
(1, 1, 'SENI-97C0F8', 'coach', 1, 2, 0, '2026-06-13 09:46:20', '2026-06-30 17:21:56', NULL, 'Senior', NULL, 1, NULL),
(2, 1, 'SENI-CBD7EC', 'joueur', 0, 1, 0, '2026-06-14 09:43:00', '2026-06-30 17:00:49', NULL, 'Senior', NULL, 1, NULL),
(3, 1, 'SENI-0E99B0', 'joueur', 0, 1, 0, '2026-06-30 17:00:42', '2026-06-30 17:00:47', NULL, 'Senior', NULL, 1, NULL),
(4, 1, 'SENI-1F18A9', 'joueur', 0, 1, 0, '2026-06-30 17:01:14', '2026-06-30 17:06:25', NULL, 'Senior', NULL, 1, NULL),
(5, 1, 'SENI-DD11DA', 'joueur', 0, 2, 0, '2026-06-30 17:06:34', '2026-06-30 17:21:55', NULL, 'Senior', NULL, 1, NULL),
(6, 1, 'SENI-5D45F0', 'coach', 0, 50, 0, '2026-06-30 17:09:05', '2026-06-30 17:21:54', NULL, 'Senior', NULL, 1, NULL),
(7, 1, 'SENI-51012E', 'joueur', 0, 1, 0, '2026-06-30 17:22:09', '2026-06-30 18:22:29', NULL, 'Senior', NULL, 1, NULL),
(9, 1, 'SENI-3909F6', 'coach', 1, 1, 0, '2026-07-05 16:46:08', '2026-08-05 06:32:46', NULL, 'Senior', NULL, 1, NULL),
(11, 1, 'SENI-1F89A3', 'joueur', 1, 1, 0, '2026-07-20 16:32:15', '2026-08-05 06:32:47', NULL, 'Senior', NULL, 1, NULL),
(12, 1, 'SENI-B1E453', 'joueur', 0, 20, 1, '2026-08-05 06:21:05', '2026-08-05 06:21:05', NULL, 'Senior', NULL, 1, NULL),
(13, 1, 'SENI-9BEFDE', 'joueur', 4, 5, 1, '2026-08-05 06:35:11', '2026-08-05 07:20:50', NULL, 'Senior', NULL, 1, NULL),
(14, 1, 'SENI-2E79CA', 'joueur', 1, 1, 1, '2026-08-08 21:00:04', '2026-08-08 21:01:57', NULL, 'Senior', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `licencies`
--

CREATE TABLE `licencies` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `equipe_id` int(11) DEFAULT NULL,
  `club_id` int(11) DEFAULT NULL,
  `numero_licence` varchar(50) DEFAULT NULL,
  `poste` varchar(50) DEFAULT NULL,
  `numero_maillot` int(11) DEFAULT NULL,
  `pied_fort` enum('droit','gauche','ambidextre') DEFAULT NULL,
  `statut` enum('actif','inactif','blesse','suspendu') DEFAULT 'actif',
  `date_expiration_licence` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `licencies`
--

INSERT INTO `licencies` (`id`, `user_id`, `equipe_id`, `club_id`, `numero_licence`, `poste`, `numero_maillot`, `pied_fort`, `statut`, `date_expiration_licence`, `created_at`, `updated_at`) VALUES
(1, 2, 4, NULL, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-06-30 17:31:13', '2026-06-30 17:31:13'),
(2, 3, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-07-05 16:01:57', '2026-07-05 16:01:57'),
(3, 3, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-07-05 16:01:57', '2026-07-05 16:01:57'),
(4, 6, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-07-20 16:37:33', '2026-07-20 16:37:33'),
(5, 6, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-07-20 16:37:33', '2026-07-20 16:37:33'),
(6, 7, 4, 1, NULL, 'Gardien', 1, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(7, 8, 4, 1, NULL, 'Défenseur', 2, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(8, 9, 4, 1, NULL, 'Défenseur', 3, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(9, 10, 4, 1, NULL, 'Défenseur', 4, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(10, 11, 4, 1, NULL, 'Milieu', 5, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(11, 12, 4, 1, NULL, 'Milieu', 6, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(12, 13, 4, 1, NULL, 'Milieu', 7, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(13, 14, 4, 1, NULL, 'Attaquant', 8, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(14, 15, 4, 1, NULL, 'Attaquant', 9, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(15, 16, 4, 1, NULL, 'Gardien', 10, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(16, 17, 4, 1, NULL, 'Défenseur', 11, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(17, 18, 4, 1, NULL, 'Défenseur', 12, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(18, 19, 4, 1, NULL, 'Défenseur', 13, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(19, 20, 4, 1, NULL, 'Milieu', 14, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(20, 21, 4, 1, NULL, 'Milieu', 15, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(21, 22, 4, 1, NULL, 'Milieu', 16, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(22, 23, 4, 1, NULL, 'Attaquant', 17, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(23, 24, 4, 1, NULL, 'Attaquant', 18, 'ambidextre', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(24, 25, 4, 1, NULL, 'Gardien', 19, 'droit', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(25, 26, 4, 1, NULL, 'Défenseur', 20, 'gauche', 'actif', NULL, '2026-08-05 06:26:51', '2026-08-05 06:26:51'),
(26, 15, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 06:27:29', '2026-08-05 06:27:29'),
(27, 15, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 06:27:29', '2026-08-05 06:27:29'),
(28, 27, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 06:36:40', '2026-08-05 06:36:40'),
(29, 27, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 06:36:40', '2026-08-05 06:36:40'),
(30, 28, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:03:27', '2026-08-05 07:03:27'),
(31, 28, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:03:27', '2026-08-05 07:03:27'),
(32, 29, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:15:40', '2026-08-05 07:15:40'),
(33, 29, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:15:40', '2026-08-05 07:15:40'),
(34, 30, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:20:50', '2026-08-05 07:20:50'),
(35, 30, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 07:20:50', '2026-08-05 07:20:50'),
(36, 27, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:52', '2026-08-05 15:45:52'),
(37, 27, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:52', '2026-08-05 15:45:52'),
(38, 28, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:54', '2026-08-05 15:45:54'),
(39, 28, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:54', '2026-08-05 15:45:54'),
(40, 29, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:57', '2026-08-05 15:45:57'),
(41, 29, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-05 15:45:57', '2026-08-05 15:45:57'),
(42, 31, 4, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-08 21:01:57', '2026-08-08 21:01:57'),
(43, 31, 6, 1, NULL, NULL, NULL, NULL, 'actif', NULL, '2026-08-08 21:01:57', '2026-08-08 21:01:57');

-- --------------------------------------------------------

--
-- Table structure for table `matchs`
--

CREATE TABLE `matchs` (
  `id` int(11) NOT NULL,
  `equipe_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `adversaire_id` int(11) DEFAULT NULL,
  `adversaire` varchar(200) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `heure_rdv` datetime DEFAULT NULL,
  `terrain_id` int(11) DEFAULT NULL,
  `domicile_exterieur` enum('domicile','exterieur') DEFAULT 'domicile',
  `type` enum('match','amical','coupe','tournoi','entrainement','autre') DEFAULT 'match',
  `statut` enum('programme','en_cours','termine','annule') DEFAULT 'programme',
  `score_equipe` int(11) DEFAULT NULL,
  `score_adversaire` int(11) DEFAULT NULL,
  `championnat` varchar(100) DEFAULT NULL,
  `journee` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `heure` time DEFAULT NULL,
  `lieu` varchar(500) DEFAULT NULL,
  `rapport` text DEFAULT NULL,
  `besoin_arbitre` tinyint(1) NOT NULL DEFAULT 0,
  `saison` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `matchs`
--

INSERT INTO `matchs` (`id`, `equipe_id`, `club_id`, `adversaire_id`, `adversaire`, `date`, `heure_rdv`, `terrain_id`, `domicile_exterieur`, `type`, `statut`, `score_equipe`, `score_adversaire`, `championnat`, `journee`, `description`, `actif`, `created_at`, `updated_at`, `heure`, `lieu`, `rapport`, `besoin_arbitre`, `saison`) VALUES
(1, 4, 0, NULL, 'TEST', '2026-06-18 20:32:00', NULL, 1, 'domicile', 'match', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-06-30 17:32:31', '2026-06-30 17:32:31', NULL, NULL, NULL, 0, NULL),
(2, 4, 0, NULL, 'TEST', '2026-06-27 22:36:00', NULL, 1, 'domicile', 'amical', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-06-30 17:34:40', '2026-06-30 17:34:40', NULL, NULL, NULL, 0, NULL),
(3, 4, 0, NULL, 'TEST', '2026-06-26 21:18:00', NULL, 1, 'domicile', 'match', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-06-30 18:19:09', '2026-06-30 18:19:09', NULL, NULL, NULL, 0, NULL),
(4, 4, 0, NULL, 'TEST', '2026-06-30 22:21:00', NULL, 1, 'domicile', 'amical', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-06-30 18:21:09', '2026-06-30 18:21:09', NULL, NULL, NULL, 0, NULL),
(6, 4, 1, NULL, 'TEST', '2026-07-16 22:05:00', '2026-07-16 19:09:00', 1, 'domicile', 'match', 'en_cours', NULL, NULL, 'Phase 1', NULL, NULL, 1, '2026-07-05 17:07:57', '2026-07-05 17:12:43', NULL, NULL, NULL, 1, '2025-2026'),
(9, 4, 1, NULL, NULL, '2026-08-11 00:00:00', NULL, 2, 'domicile', 'entrainement', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-05 15:48:10', '2026-08-05 15:48:10', '19:15:00', NULL, NULL, 0, NULL),
(10, 4, 1, NULL, NULL, '2026-08-18 00:00:00', NULL, 2, 'domicile', 'entrainement', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-05 15:48:10', '2026-08-05 15:48:10', '19:15:00', NULL, NULL, 0, NULL),
(11, 4, 1, NULL, NULL, '2026-08-25 00:00:00', NULL, 2, 'domicile', 'entrainement', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-05 15:48:10', '2026-08-05 15:48:10', '19:15:00', NULL, NULL, 0, NULL),
(12, 4, 1, NULL, NULL, '2026-08-13 19:15:00', '2026-08-13 19:00:00', 2, 'domicile', 'entrainement', 'programme', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-05 15:49:18', '2026-08-05 15:49:18', NULL, NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `match_events`
--

CREATE TABLE `match_events` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `type` enum('but','but_annule','carton_jaune','carton_rouge','remplacement','fin_mi_temps','debut') NOT NULL,
  `minute` int(11) DEFAULT NULL,
  `joueur_id` int(11) DEFAULT NULL,
  `equipe` enum('domicile','exterieur') DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `passeur_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `match_events`
--

INSERT INTO `match_events` (`id`, `match_id`, `club_id`, `type`, `minute`, `joueur_id`, `equipe`, `description`, `created_at`, `passeur_id`) VALUES
(1, 5, 1, 'debut', 0, NULL, NULL, NULL, '2026-06-30 20:17:00', NULL),
(2, 5, 1, 'debut', 0, NULL, NULL, NULL, '2026-06-30 20:17:05', NULL),
(3, 5, 1, 'debut', 0, NULL, NULL, NULL, '2026-06-30 20:17:08', NULL),
(4, 5, 1, 'debut', 0, NULL, NULL, NULL, '2026-06-30 20:17:27', NULL),
(5, 6, 1, 'debut', 0, NULL, NULL, NULL, '2026-07-05 17:12:43', NULL),
(6, 6, 1, 'debut', 0, NULL, NULL, NULL, '2026-07-05 17:12:57', NULL),
(7, 6, 1, 'debut', 0, NULL, NULL, NULL, '2026-07-05 17:12:58', NULL),
(8, 6, 1, 'debut', 0, NULL, NULL, NULL, '2026-07-05 17:12:59', NULL),
(9, 13, 1, 'debut', 0, NULL, NULL, NULL, '2026-08-05 16:04:25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `channel_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `contenu` text NOT NULL,
  `type` enum('texte','image','fichier','systeme') DEFAULT 'texte',
  `lu_par` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `club_id` int(11) DEFAULT NULL,
  `type` enum('convocation','match','message','resultat','systeme','rappel','annulation','info','vote','arbitrage','rappel_veille') NOT NULL,
  `titre` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `data` longtext DEFAULT NULL,
  `send_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lien` varchar(500) DEFAULT NULL,
  `lu_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `club_id`, `type`, `titre`, `message`, `lu`, `data`, `send_at`, `created_at`, `updated_at`, `lien`, `lu_at`) VALUES
(1, 2, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 18/06/2026 contre TEST', 1, '{\"match_id\":1}', NULL, '2026-06-30 17:33:02', '2026-06-30 18:16:27', '/convocations', '2026-06-30 18:16:27'),
(2, 1, NULL, 'systeme', '🔔 Notification de test', 'Test envoyé depuis le panel de diagnostic par le superadmin. Si vous voyez cette notification, le système de notifications in-app fonctionne correctement.', 1, NULL, NULL, '2026-07-03 08:46:35', '2026-07-04 12:20:10', '/diagnostic', '2026-07-04 12:20:10'),
(3, 1, NULL, 'systeme', '🔔 Notification de test', 'Test envoyé depuis le panel de diagnostic par le superadmin. Si vous voyez cette notification, le système de notifications in-app fonctionne correctement.', 1, NULL, NULL, '2026-07-03 14:14:26', '2026-07-04 12:20:08', '/diagnostic', '2026-07-04 12:20:08'),
(4, 3, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 16/07/2026 contre TEST', 1, '{\"match_id\":6}', NULL, '2026-07-05 17:09:04', '2026-07-10 18:06:29', '/convocations', '2026-07-10 18:06:29'),
(5, 1, NULL, 'systeme', '🔔 Notification de test', 'Test envoyé depuis le panel de diagnostic par le superadmin. Si vous voyez cette notification, le système de notifications in-app fonctionne correctement.', 1, NULL, NULL, '2026-07-09 06:05:40', '2026-07-09 06:05:43', '/diagnostic', '2026-07-09 06:05:43'),
(6, 1, NULL, 'systeme', '🔔 Notification de test', 'Test envoyé depuis le panel de diagnostic par le superadmin. Si vous voyez cette notification, le système de notifications in-app fonctionne correctement.', 1, NULL, NULL, '2026-08-05 06:28:39', '2026-08-05 06:28:42', '/diagnostic', '2026-08-05 06:28:42'),
(7, 7, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(8, 8, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(9, 9, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(10, 10, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(11, 11, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(12, 12, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(13, 13, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(14, 14, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(15, 15, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(16, 16, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(17, 17, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(18, 18, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(19, 19, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL),
(20, 20, NULL, 'convocation', 'Convocation — Match', 'Vous êtes convoqué(e) pour le 30/08/2026 contre Trou du cul', 0, '{\"match_id\":13}', NULL, '2026-08-05 15:58:57', '2026-08-05 15:58:57', '/convocations', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `player_votes`
--

CREATE TABLE `player_votes` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `voter_id` int(11) NOT NULL,
  `voted_for_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `valeur` int(11) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `uses_count` int(11) NOT NULL DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `type`, `valeur`, `description`, `max_uses`, `uses_count`, `expires_at`, `actif`, `created_by`, `createdAt`, `updatedAt`) VALUES
(1, 'CODE-FCLEDOULIEU', 'percent', 20, 'Partenariat FC Le Doulieu', NULL, 0, NULL, 1, NULL, '2026-07-04 11:07:20', '2026-07-04 11:07:20');

-- --------------------------------------------------------

--
-- Table structure for table `SequelizeMeta`
--

CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sports`
--

CREATE TABLE `sports` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `icone` varchar(50) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nb_joueurs_equipe` int(11) DEFAULT 11
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sports`
--

INSERT INTO `sports` (`id`, `nom`, `icone`, `actif`, `created_at`, `updated_at`, `nb_joueurs_equipe`) VALUES
(1, 'Football', 'soccer-ball', 1, '2026-06-02 18:08:34', '2026-06-02 18:08:34', 11),
(2, 'Futsal', 'futsal', 1, '2026-06-02 18:08:34', '2026-06-02 18:08:34', 5),
(3, 'Rugby', 'rugby-ball', 1, '2026-06-02 18:08:34', '2026-06-02 18:08:34', 15),
(4, 'Basketball', 'basketball', 1, '2026-06-02 18:08:34', '2026-06-02 18:08:34', 5),
(5, 'Handball', 'handball', 1, '2026-06-02 18:08:34', '2026-06-02 18:08:34', 7);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `owner_type` enum('club','user') NOT NULL,
  `owner_id` int(11) NOT NULL,
  `plan` enum('mensuel','annuel') NOT NULL,
  `statut` enum('actif','expire','annule','impaye') NOT NULL DEFAULT 'actif',
  `stripe_customer_id` varchar(100) DEFAULT NULL,
  `stripe_subscription_id` varchar(100) DEFAULT NULL,
  `promo_code` varchar(30) DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `rappel_envoye` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `club_id` int(11) DEFAULT NULL,
  `sujet` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `priorite` enum('normal','haute','urgent') NOT NULL DEFAULT 'normal',
  `statut` enum('ouvert','en_cours','resolu','ferme') NOT NULL DEFAULT 'ouvert',
  `reponse` text DEFAULT NULL,
  `repondu_par` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `terrains`
--

CREATE TABLE `terrains` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `capacite` int(11) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `terrains`
--

INSERT INTO `terrains` (`id`, `club_id`, `nom`, `adresse`, `ville`, `code_postal`, `capacite`, `actif`, `created_at`, `updated_at`) VALUES
(1, 1, 'Terrain d\'honneur', '', NULL, NULL, 200, 1, '2026-06-14 09:59:56', '2026-06-14 09:59:56'),
(2, 1, 'Terrain d\'entrainement', '', NULL, NULL, 100, 1, '2026-07-03 15:51:40', '2026-07-03 15:51:40'),
(3, 1, '__diag_test_updated__', NULL, NULL, NULL, NULL, 0, '2026-07-05 16:45:54', '2026-07-05 16:45:54'),
(4, 1, '__diag_test_updated__', NULL, NULL, NULL, NULL, 0, '2026-07-09 06:05:30', '2026-07-09 06:05:30'),
(5, 1, 'Terrain intermédiaire', '', NULL, NULL, 100, 1, '2026-08-08 21:03:40', '2026-08-08 21:03:40');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('superadmin','admin','dirigeant','coach','joueur','parent','visiteur') DEFAULT 'joueur',
  `club_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `derniere_connexion` datetime DEFAULT NULL,
  `notif_email` tinyint(1) DEFAULT 1,
  `notif_push` tinyint(1) DEFAULT 1,
  `pied_fort` enum('droit','gauche','ambidextre') DEFAULT NULL,
  `poste` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `taille` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verify_token` varchar(64) DEFAULT NULL,
  `email_verify_expires` datetime DEFAULT NULL,
  `two_fa_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_fa_code` varchar(6) DEFAULT NULL,
  `two_fa_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `password_hash`, `role`, `club_id`, `parent_id`, `google_id`, `refresh_token`, `avatar`, `telephone`, `date_naissance`, `actif`, `derniere_connexion`, `notif_email`, `notif_push`, `pied_fort`, `poste`, `created_at`, `updated_at`, `taille`, `email_verified`, `email_verify_token`, `email_verify_expires`, `two_fa_enabled`, `two_fa_code`, `two_fa_expires`) VALUES
(1, 'Maquet', 'Hugo', 'hugo22042006@gmail.com', NULL, 'superadmin', NULL, NULL, '105766615634534912279', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyYWRtaW4iLCJjbHViX2lkIjpudWxsLCJpYXQiOjE3ODY1MzM1NTYsImV4cCI6MTc4NzEzODM1Nn0.1_rh_bYbW9j9iSYS0IvfzEKkl3_P2WthxhkhCo9Fpcg', 'https://lh3.googleusercontent.com/a/ACg8ocLCf_Gg_JUfMsdRzmQcMvtxTVz9xriVCjeCgij-9PAoh4orEbE=s96-c', '0651420020', NULL, 1, '2026-08-12 11:19:16', 1, 1, NULL, NULL, '2026-06-12 14:23:21', '2026-08-12 11:19:16', NULL, 0, NULL, NULL, 0, NULL, NULL),
(2, 'Maquet', 'Hugo', 'hugo.maquet2204@gmail.com', NULL, 'coach', 1, NULL, '102240548389093754116', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6ImNvYWNoIiwiY2x1Yl9pZCI6MSwiaWF0IjoxNzg2NTMzNTY0LCJleHAiOjE3ODcxMzgzNjR9.zAaT4Iu0Thoor6t9yF_Go1UCszkXTF76h6pT3QeuWAk', 'https://drive.google.com/thumbnail?id=1sE5ksoj45ZR091DMpU2JFPi6jrjcGrkQ&sz=w1000', '0651420020', '2026-06-26', 1, '2026-08-12 11:19:24', 1, 1, 'droit', 'Aillier', '2026-06-13 09:46:27', '2026-08-12 11:19:24', 165, 1, NULL, NULL, 1, NULL, NULL),
(4, 'ANGELE WYON', 'ANGELE', 'angele.wyon@gmail.com', NULL, 'coach', 1, NULL, '104386522269063535867', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImNvYWNoIiwiY2x1Yl9pZCI6MSwiaWF0IjoxNzgzMTEwMzExLCJleHAiOjE3ODM3MTUxMTF9.i_gCAO8Qhn6kOdd-F1VZYJbs1tDyTht40YWrMXMrklw', 'https://lh3.googleusercontent.com/a/ACg8ocKIhpDK_NaEerfmgTm61UgTGJCIyx0cM73tDoYMFj5ea4TB2A=s96-c', '0768061675', '2006-08-28', 1, '2026-07-03 20:25:11', 1, 1, NULL, NULL, '2026-07-02 18:43:03', '2026-07-04 16:39:44', NULL, 0, NULL, NULL, 0, NULL, NULL),
(5, 'Nelsonwinner Yt', 'Nelsonwinner', 'carottes1109@gmail.com', 'Hugo220406', 'coach', 1, NULL, '118377108886445539353', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6ImNvYWNoIiwiY2x1Yl9pZCI6MSwiaWF0IjoxNzgzMjgzOTI3LCJleHAiOjE3ODM4ODg3Mjd9._gPfVvnXmCOQhgQEQEGJVxeqxk-KhpINBiam4O8Kj2U', 'https://drive.google.com/thumbnail?id=18K_fJDi_JzpeINIeDfUDW_joP0qLWNA_&sz=w1000', '0651420020', '2006-04-22', 0, '2026-07-05 20:38:47', 1, 1, 'droit', 'GARDIEN', '2026-07-05 16:46:16', '2026-08-05 06:28:08', 173, 0, NULL, NULL, 0, NULL, NULL),
(6, 'Maquet', 'Sébastien', 'sma22041703@gmail.com', '$2a$12$E7BSHacCtsxTfrfOhN0OweZ6pktt2s2BqX5pGQhlB/Ub1Rw9GEN92', 'coach', 1, NULL, '103661466499366650106', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Niwicm9sZSI6ImNvYWNoIiwiY2x1Yl9pZCI6MSwiaWF0IjoxNzg1OTQ1Nzk5LCJleHAiOjE3ODY1NTA1OTl9.6gZY4f4aVqW4pet1a3jg0knFn72GwXECj_jatkr1tYo', NULL, '0699018208', '1976-03-11', 1, '2026-08-05 16:03:19', 1, 1, 'droit', 'Attaquant', '2026-07-20 16:37:33', '2026-08-05 16:03:19', 163, 0, 'b13d5ebecf113b326f18b206fc2cfa8517ccbd6495b9b2fc54fd7cee8f20068a', '2026-07-21 16:47:17', 0, NULL, NULL),
(7, 'Garcia', 'Clément', 'test.joueur1@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Gardien', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(8, 'Leroy', 'Hugo', 'test.joueur2@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(9, 'Dubois', 'Baptiste', 'test.joueur3@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(10, 'Laurent', 'Léo', 'test.joueur4@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(11, 'Simon', 'Kevin', 'test.joueur5@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(12, 'Bertrand', 'Quentin', 'test.joueur6@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(13, 'Martin', 'Rayan', 'test.joueur7@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(14, 'Lefebvre', 'Bastien', 'test.joueur8@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Attaquant', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(15, 'Robert', 'Thomas', 'test.joueur9@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Attaquant', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(16, 'Vincent', 'Alexandre', 'test.joueur10@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Gardien', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(17, 'Bernard', 'Théo', 'test.joueur11@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(18, 'Dupont', 'Julien', 'test.joueur12@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(19, 'Thomas', 'Enzo', 'test.joueur13@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(20, 'Moreau', 'Romain', 'test.joueur14@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(21, 'David', 'Mathis', 'test.joueur15@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(22, 'Durand', 'Yanis', 'test.joueur16@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Milieu', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(23, 'Michel', 'Antoine', 'test.joueur17@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Attaquant', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(24, 'Fournier', 'Maxime', 'test.joueur18@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'ambidextre', 'Attaquant', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(25, 'Petit', 'Lucas', 'test.joueur19@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'droit', 'Gardien', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(26, 'Roux', 'Nathan', 'test.joueur20@fcledoulieu-test.fr', NULL, 'joueur', 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'gauche', 'Défenseur', '2026-08-05 06:26:51', '2026-08-05 06:26:51', NULL, 0, NULL, NULL, 0, NULL, NULL),
(27, 'Maquet', 'Sébastien', 'smaquet@trenois.com', '$2a$12$aRjtwH5aSFKEpWLXu3RjB.AJaTGoOolktqK8Nk1eoGhJJlN7lkl7W', 'joueur', 1, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjcsInJvbGUiOiJqb3VldXIiLCJjbHViX2lkIjoxLCJpYXQiOjE3ODU5MTE4MDAsImV4cCI6MTc4NjUxNjYwMH0.9mt9oKIjTFP_p_4KFsHiyFhfyF9MaL64NncDst1cWEg', NULL, '0699018208', '1976-03-11', 1, NULL, 1, 1, 'droit', 'Attaquant', '2026-08-05 06:36:40', '2026-08-05 06:37:24', 163, 0, 'ece97b2d645044e74519714bdcfacaa67ce4e997d9ab1c50c630bf8d7489259b', '2026-08-06 06:36:40', 0, NULL, NULL),
(28, 'Maquet', 'Sébastien', 'smaquet2204@outlook.com', '$2a$12$aZx/Xim5sofZrBIKdU5IouuMvLQdkv2kg5aZlHgOPsJAvLVw7sbFC', 'joueur', 1, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjgsInJvbGUiOiJqb3VldXIiLCJjbHViX2lkIjoxLCJpYXQiOjE3ODU5MTM0MDcsImV4cCI6MTc4NjUxODIwN30.rbxPx0dlSTrC_VfSDLrd-hfeBUfTScT9SIdRx5z3CkM', NULL, '0699018208', '1976-03-11', 1, NULL, 1, 1, 'droit', 'Attaquant', '2026-08-05 07:03:27', '2026-08-05 15:45:48', 163, 0, 'a6f0c1d2d43cd74661d8998fc2a146fdf43074e701209cd35d11264dc520e2e6', '2026-08-06 07:03:27', 0, NULL, NULL),
(29, 'Maquet', 'Sébastien', 'smaquet2204@gmail.com', '$2a$12$9PYmKSmzdu8Z4N.GdMZF.OH/Hv9e/QnigXeZ.x02MpMF1CEOdpPe.', 'joueur', 1, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjksInJvbGUiOiJqb3VldXIiLCJjbHViX2lkIjoxLCJpYXQiOjE3ODU5MTQxNDAsImV4cCI6MTc4NjUxODk0MH0.2z8uySbZNZHq1O9HbW-6dd8votdHIzDCLKtIKQDgaP4', NULL, '0699018208', '1976-03-11', 1, NULL, 1, 1, 'droit', 'Attaquant', '2026-08-05 07:15:40', '2026-08-05 07:16:18', 163, 0, '3b6ca71c1c7ac1d0637ade29d0b2c1eb9ba8065393e495380eb680ebd5ba3549', '2026-08-06 07:15:40', 0, NULL, NULL),
(30, 'Maq', 'Seb', 'smaquet@gmail.com', '$2a$12$65Fz0NZSn7JEJ3STqhZb/eMVlvJ/G6pPB7pYoZBNrdD0ALsAcogme', 'joueur', 1, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzAsInJvbGUiOiJqb3VldXIiLCJjbHViX2lkIjoxLCJpYXQiOjE3ODU5MTQ0NTAsImV4cCI6MTc4NjUxOTI1MH0.HixX_WIJbYXZPHiDUqNrVU6hl5jmSf2m0gVOLsHwUX4', NULL, '0699018208', '2020-03-11', 1, NULL, 1, 1, 'droit', 'Attaquant', '2026-08-05 07:20:49', '2026-08-05 07:21:22', 163, 0, '26d283f75fe6266ce23719230ed8411730048faf0f21c7d220feb56bcb24b09d', '2026-08-06 07:20:50', 0, NULL, NULL),
(31, 'Vandenbussche', 'Lucas', 'lucasvandenbussche62@gmail.com', '$2a$12$kx0vuKm//jFm0Bd637BvZO2Q.EuORKb3fykN1YoVkYPAMqjBDEFm.', 'joueur', 1, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEsInJvbGUiOiJqb3VldXIiLCJjbHViX2lkIjoxLCJpYXQiOjE3ODYyMjI5MTcsImV4cCI6MTc4NjgyNzcxN30.UYmsrXKsjM0JrLTACcILuiGtRFWhkG7AcT_FAp15EWw', NULL, '0784921126', '2006-01-10', 1, NULL, 1, 1, 'droit', 'Défenseur', '2026-08-08 21:01:57', '2026-08-08 21:02:53', 178, 0, '9e84d518d92e1a94d16f336cc1b31593b3e25bd275bc561fe69fba72c4c149d0', '2026-08-09 21:01:57', 0, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adversaires`
--
ALTER TABLE `adversaires`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `arbitrage_presences`
--
ALTER TABLE `arbitrage_presences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_presence` (`club_id`,`user_id`,`date`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `channels`
--
ALTER TABLE `channels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ch_equipes`
--
ALTER TABLE `ch_equipes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ch_matchs`
--
ALTER TABLE `ch_matchs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dom_id` (`dom_id`),
  ADD KEY `ext_id` (`ext_id`);

--
-- Indexes for table `clubs`
--
ALTER TABLE `clubs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `compositions`
--
ALTER TABLE `compositions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `convocations`
--
ALTER TABLE `convocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipes`
--
ALTER TABLE `equipes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipe_coachs`
--
ALTER TABLE `equipe_coachs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `follows`
--
ALTER TABLE `follows`
  ADD PRIMARY KEY (`follower_id`,`followed_id`);

--
-- Indexes for table `invite_codes`
--
ALTER TABLE `invite_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `licencies`
--
ALTER TABLE `licencies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `matchs`
--
ALTER TABLE `matchs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `match_events`
--
ALTER TABLE `match_events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `player_votes`
--
ALTER TABLE `player_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_vote_per_match` (`match_id`,`voter_id`);

--
-- Indexes for table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_promo_actif` (`actif`);

--
-- Indexes for table `SequelizeMeta`
--
ALTER TABLE `SequelizeMeta`
  ADD PRIMARY KEY (`name`);

--
-- Indexes for table `sports`
--
ALTER TABLE `sports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stripe_subscription_id` (`stripe_subscription_id`),
  ADD KEY `idx_sub_owner` (`owner_type`,`owner_id`),
  ADD KEY `idx_sub_statut` (`statut`),
  ADD KEY `idx_sub_period_end` (`current_period_end`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_support_user` (`user_id`),
  ADD KEY `idx_support_club` (`club_id`),
  ADD KEY `idx_support_statut` (`statut`);

--
-- Indexes for table `terrains`
--
ALTER TABLE `terrains`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adversaires`
--
ALTER TABLE `adversaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `arbitrage_presences`
--
ALTER TABLE `arbitrage_presences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `channels`
--
ALTER TABLE `channels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ch_equipes`
--
ALTER TABLE `ch_equipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ch_matchs`
--
ALTER TABLE `ch_matchs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clubs`
--
ALTER TABLE `clubs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `compositions`
--
ALTER TABLE `compositions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `convocations`
--
ALTER TABLE `convocations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `equipes`
--
ALTER TABLE `equipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `equipe_coachs`
--
ALTER TABLE `equipe_coachs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `invite_codes`
--
ALTER TABLE `invite_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `licencies`
--
ALTER TABLE `licencies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `matchs`
--
ALTER TABLE `matchs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `match_events`
--
ALTER TABLE `match_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `player_votes`
--
ALTER TABLE `player_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=390;

--
-- AUTO_INCREMENT for table `sports`
--
ALTER TABLE `sports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `terrains`
--
ALTER TABLE `terrains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ch_matchs`
--
ALTER TABLE `ch_matchs`
  ADD CONSTRAINT `ch_matchs_ibfk_1` FOREIGN KEY (`dom_id`) REFERENCES `ch_equipes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ch_matchs_ibfk_2` FOREIGN KEY (`ext_id`) REFERENCES `ch_equipes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
