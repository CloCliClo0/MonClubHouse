require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const UPLOADS_PATH = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH, { recursive: true });

const passport = require('./config/passport');
const { sequelize } = require('./models');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const clubsRoutes = require('./routes/clubs');
const equipesRoutes = require('./routes/equipes');
const licenciesRoutes = require('./routes/licencies');
const matchsRoutes = require('./routes/matchs');
const chatRoutes = require('./routes/chat');
const resultatsRoutes = require('./routes/resultats');
const profilRoutes = require('./routes/profil');
const adminRoutes  = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const codesRoutes        = require('./routes/codes');
const adversairesRoutes  = require('./routes/adversaires');
const championnatRoutes  = require('./routes/championnat');
const scraperRoutes      = require('./routes/scraper');
const aiScraperRoutes    = require('./routes/aiScraper');
const voteRoutes         = require('./routes/vote');
const arbitrageRoutes    = require('./routes/arbitrage');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'https://monclubhouse.fr',
      'http://monclubhouse.fr',
      'https://www.monclubhouse.fr',
      'http://localhost:5173',
      ...(process.env.SOCKET_CORS_ORIGIN ? [process.env.SOCKET_CORS_ORIGIN] : []),
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Enregistrer le handler Socket.io
require('./sockets/chatSocket')(io);

// Rendre io accessible dans les controllers
app.set('io', io);

// Hostinger utilise un reverse proxy — nécessaire pour rate-limit et IP réelle
app.set('trust proxy', 1);

// Middlewares globaux
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'wss://monclubhouse.fr', 'https://monclubhouse.fr', 'ws://monclubhouse.fr', 'http://monclubhouse.fr']
    }
  }
}));

// Accepte HTTP et HTTPS, et les deux sous-domaines courants
const allowedOrigins = [
  'https://monclubhouse.fr',
  'http://monclubhouse.fr',
  'https://www.monclubhouse.fr',
  'http://www.monclubhouse.fr',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.APP_URL ? [process.env.APP_URL] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (mobile, curl, Postman) et les origins connues
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // En prod Hostinger on accepte tout (nginx filtre déjà)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Répond immédiatement aux preflight OPTIONS
app.options('*', cors());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Fichiers statiques (build Vite)
const CLIENT_PATH = path.join(__dirname, '..', 'front', 'dist');
app.use(express.static(CLIENT_PATH));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/licencies', licenciesRoutes);
app.use('/api/matchs', matchsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resultats', resultatsRoutes);
app.use('/api/profil', profilRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/codes',        codesRoutes);
app.use('/api/adversaires',  adversairesRoutes);
app.use('/api/championnat',  championnatRoutes);
app.use('/api/scraper',      scraperRoutes);
app.use('/api/ai-scraper',   aiScraperRoutes);
app.use('/api/votes',        voteRoutes);
app.use('/api/arbitrage',    arbitrageRoutes);
app.use('/api/diagnostic',   require('./routes/diagnostic'));

// Auth Google (hors /api pour le redirect OAuth)
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: process.env.APP_NAME, env: process.env.NODE_ENV });
});

// Diagnostic API — teste DB + retourne les infos de connexion
app.get('/api/ping', async (req, res) => {
  const { sequelize } = require('./models');
  try {
    await sequelize.authenticate();
    res.json({ success: true, db: 'connected', env: process.env.NODE_ENV });
  } catch (e) {
    res.status(503).json({ success: false, db: 'error', message: e.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route introuvable' });
  }
  res.sendFile(path.join(CLIENT_PATH, 'index.html'), err => {
    if (err) res.status(404).json({ success: false, message: 'Frontend non trouvé. Lancer le build.' });
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erreur interne' : err.message
  });
});

// Démarrage
const PORT = process.env.PORT || 3000;

// Le serveur démarre toujours — la DB se connecte en arrière-plan avec retry
server.listen(PORT, () => {
  console.log(`[Server] MonClubHouse démarré sur le port ${PORT}`);
  console.log(`[Server] URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
});

const runMigrations = async () => {
  // invite_codes : renommer anciens noms si besoin, ajouter colonnes manquantes
  try { await sequelize.query('ALTER TABLE invite_codes CHANGE COLUMN usage_count uses_count INT DEFAULT 0'); console.log('[Migration] invite_codes.usage_count → uses_count'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes CHANGE COLUMN max_usage max_uses INT DEFAULT 50'); console.log('[Migration] invite_codes.max_usage → max_uses'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN uses_count INT DEFAULT 0'); console.log('[Migration] invite_codes.uses_count ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN max_uses INT DEFAULT 50'); console.log('[Migration] invite_codes.max_uses ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes MODIFY COLUMN equipe_id INT NULL'); console.log('[Migration] invite_codes.equipe_id nullable'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN equipe_id INT NULL'); console.log('[Migration] invite_codes.equipe_id ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN categorie VARCHAR(50) NULL'); console.log('[Migration] invite_codes.categorie ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN label VARCHAR(100) NULL'); console.log('[Migration] invite_codes.label ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN created_by INT NULL'); console.log('[Migration] invite_codes.created_by ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE invite_codes ADD COLUMN expires_at DATETIME NULL'); console.log('[Migration] invite_codes.expires_at ajouté'); } catch (e) {}

  // licencies : rendre equipe_id nullable pour joueurs sans équipe assignée
  try { await sequelize.query('ALTER TABLE licencies MODIFY COLUMN equipe_id INT NULL'); console.log('[Migration] licencies.equipe_id nullable'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE licencies MODIFY COLUMN club_id INT NULL'); console.log('[Migration] licencies.club_id nullable'); } catch (e) {}

  // matchs : colonnes manquantes (lieu, rapport, heure)
  try { await sequelize.query('ALTER TABLE matchs ADD COLUMN heure TIME NULL'); console.log('[Migration] matchs.heure ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE matchs ADD COLUMN lieu VARCHAR(500) NULL'); console.log('[Migration] matchs.lieu ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE matchs ADD COLUMN rapport TEXT NULL'); console.log('[Migration] matchs.rapport ajouté'); } catch (e) {}

  // notifications : colonnes manquantes (lien, lu_at)
  try { await sequelize.query('ALTER TABLE notifications ADD COLUMN lien VARCHAR(500) NULL'); console.log('[Migration] notifications.lien ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE notifications ADD COLUMN lu_at DATETIME NULL'); console.log('[Migration] notifications.lu_at ajouté'); } catch (e) {}

  // convocations : colonnes manquantes (reponse_at, notifie, notifie_at)
  try { await sequelize.query('ALTER TABLE convocations ADD COLUMN reponse_at DATETIME NULL'); console.log('[Migration] convocations.reponse_at ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE convocations ADD COLUMN notifie TINYINT(1) DEFAULT 0'); console.log('[Migration] convocations.notifie ajouté'); } catch (e) {}
  try { await sequelize.query('ALTER TABLE convocations ADD COLUMN notifie_at DATETIME NULL'); console.log('[Migration] convocations.notifie_at ajouté'); } catch (e) {}

  // sports : colonnes manquantes (nb_joueurs_equipe)
  try { await sequelize.query('ALTER TABLE sports ADD COLUMN nb_joueurs_equipe INT DEFAULT 11'); console.log('[Migration] sports.nb_joueurs_equipe ajouté'); } catch (e) {}

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS equipe_coachs (
        equipe_id INT NOT NULL,
        user_id   INT NOT NULL,
        PRIMARY KEY (equipe_id, user_id),
        FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] equipe_coachs créée');
  } catch (e) { /* déjà existante */ }

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS adversaires (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        club_id    INT NOT NULL,
        nom        VARCHAR(200) NOT NULL,
        categorie  VARCHAR(50)  NULL,
        ville      VARCHAR(100) NULL,
        contact    VARCHAR(255) NULL,
        telephone  VARCHAR(20)  NULL,
        couleur    VARCHAR(7)   DEFAULT '#1b4332',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] adversaires créée');
  } catch (e) { /* déjà existante */ }

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ch_equipes (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        club_id       INT NOT NULL,
        equipe_ref_id INT NOT NULL,
        equipe_id     INT NULL,
        nom           VARCHAR(200) NOT NULL,
        saison        VARCHAR(20)  NOT NULL,
        championnat   VARCHAR(200) NULL,
        couleur       VARCHAR(7)   DEFAULT '#6c757d',
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] ch_equipes créée');
  } catch (e) { /* déjà existante */ }

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ch_matchs (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        club_id       INT NOT NULL,
        equipe_ref_id INT NOT NULL,
        dom_id        INT NOT NULL,
        ext_id        INT NOT NULL,
        journee       INT  NULL,
        date          DATE NULL,
        score_dom     INT  NULL,
        score_ext     INT  NULL,
        saison        VARCHAR(20)  NOT NULL,
        championnat   VARCHAR(200) NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dom_id) REFERENCES ch_equipes(id) ON DELETE CASCADE,
        FOREIGN KEY (ext_id) REFERENCES ch_equipes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] ch_matchs créée');
  } catch (e) { /* déjà existante */ }

  // Champs profil utilisateur
  try {
    await sequelize.query(`ALTER TABLE users ADD COLUMN pied_fort ENUM('droit','gauche','ambidextre') NULL`);
    console.log('[Migration] users.pied_fort ajouté');
  } catch (e) { /* déjà existant */ }
  try {
    await sequelize.query(`ALTER TABLE users ADD COLUMN poste VARCHAR(50) NULL`);
    console.log('[Migration] users.poste ajouté');
  } catch (e) { /* déjà existant */ }

  // Notifications : nouveaux types et send_at
  try {
    await sequelize.query(`ALTER TABLE notifications MODIFY COLUMN type ENUM('convocation','match','message','resultat','systeme','rappel','annulation','info','vote','arbitrage','rappel_veille') NOT NULL`);
    console.log('[Migration] notifications.type étendu');
  } catch (e) { /* déjà ok */ }
  try {
    await sequelize.query(`ALTER TABLE notifications ADD COLUMN send_at DATETIME NULL`);
    console.log('[Migration] notifications.send_at ajouté');
  } catch (e) { /* déjà existant */ }

  // Table match_events
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS match_events (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        match_id   INT NOT NULL,
        club_id    INT NOT NULL,
        type       ENUM('but','but_annule','carton_jaune','carton_rouge','remplacement','fin_mi_temps','debut') NOT NULL,
        minute     INT NULL,
        joueur_id  INT NULL,
        equipe     ENUM('domicile','exterieur') NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id)  REFERENCES matchs(id) ON DELETE CASCADE,
        FOREIGN KEY (joueur_id) REFERENCES users(id)  ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] match_events créée');
  } catch (e) { /* déjà existante */ }

  // Table player_votes
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS player_votes (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        match_id      INT NOT NULL,
        club_id       INT NOT NULL,
        voter_id      INT NOT NULL,
        voted_for_id  INT NOT NULL,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_vote (match_id, voter_id),
        FOREIGN KEY (match_id)     REFERENCES matchs(id) ON DELETE CASCADE,
        FOREIGN KEY (voter_id)     REFERENCES users(id)  ON DELETE CASCADE,
        FOREIGN KEY (voted_for_id) REFERENCES users(id)  ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] player_votes créée');
  } catch (e) { /* déjà existante */ }

  // Table arbitrage_presences
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS arbitrage_presences (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        club_id     INT NOT NULL,
        user_id     INT NOT NULL,
        date        DATE NOT NULL,
        commentaire VARCHAR(500) NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_arb (club_id, user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Migration] arbitrage_presences créée');
  } catch (e) { /* déjà existante */ }
};

const connectDB = async (retries = 10, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('[DB] Connexion MySQL réussie');
      await runMigrations();
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        console.log('[DB] Modèles synchronisés');
      }
      return;
    } catch (err) {
      console.warn(`[DB] Tentative ${i}/${retries} échouée : ${err.message}`);
      if (i < retries) await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('[DB] Impossible de se connecter après plusieurs tentatives — les routes API renverront 503');
};

connectDB().then(() => {
  // Cron rappels J-1 — toutes les heures
  try {
    const cron = require('node-cron');
    const { createReminders } = require('./controllers/notificationController');
    cron.schedule('0 * * * *', async () => {
      try { await createReminders(); }
      catch (e) { console.error('[Cron rappels]', e.message); }
    });
    console.log('[Cron] Rappels J-1 planifiés (toutes les heures)');
  } catch (e) {
    console.warn('[Cron] node-cron non disponible :', e.message);
  }
});

module.exports = { app, io };
