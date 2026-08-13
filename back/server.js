require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const UPLOADS_PATH = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH, { recursive: true });

const passport = require('./config/passport');
const { sequelize } = require('./models');
const { apiLimiter, authLimiter, aiLimiter, resetPasswordLimiter } = require('./middlewares/rateLimiter');

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
const categoriesRoutes   = require('./routes/categories');

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

// ── Compression gzip/brotli (avant tout) ──────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// Middlewares globaux
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      scriptSrc:       ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
      styleSrc:        ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:         ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:          ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc:      ["'self'", 'wss://monclubhouse.fr', 'https://monclubhouse.fr', 'ws://monclubhouse.fr', 'http://monclubhouse.fr'],
      frameAncestors:  ["'none'"],
      baseUri:         ["'self'"],
      formAction:      ["'self'"],
      objectSrc:       ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

// Permissions-Policy — désactive les APIs non utilisées
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Sanitisation globale — supprime les null bytes et limite les clés excessivement longues
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.length > 200) { delete obj[key]; continue; }
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/\0/g, '').trimStart();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  next();
});

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
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS non autorisé'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Répond immédiatement aux preflight OPTIONS
app.options('*', cors());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Webhook Stripe : body brut requis pour la vérification de signature — AVANT express.json()
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), require('./controllers/subscriptionController').webhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Fichiers statiques (build Vite) — cache long terme sur les assets hachés
const CLIENT_PATH = path.join(__dirname, '..', 'front', 'dist');
app.use(express.static(CLIENT_PATH, {
  maxAge: '1y',
  immutable: true,
  // index.html jamais mis en cache (requis pour SPA routing)
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html') || filePath.endsWith('manifest.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  // Empêche d'afficher les fichiers HTML uploadés comme pages
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/auth/forgot-password', resetPasswordLimiter);
app.use('/api/ai-scraper/analyse', aiLimiter);

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
app.use('/api/categories',   categoriesRoutes);
app.use('/api/diagnostic',   require('./routes/diagnostic'));
app.use('/api/support',      require('./routes/support'));
app.use('/api/promo-codes',  require('./routes/promoCodes'));
app.use('/api/subscription', require('./routes/subscription'));

// Auth Google — uniquement les routes OAuth (hors /api pour le redirect Google)
// Les endpoints sensibles (login, register) ne sont exposés qu'à /api/auth/ (avec rate limiting)
const oauthRouter = require('express').Router();
const { googleCallback } = require('./controllers/authController');
oauthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
oauthRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  googleCallback
);
app.use('/auth', oauthRouter);

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

const applyStartupMigrations = async () => {
  // Chaque bloc pousse ici son erreur en plus du console.warn existant — un résumé structuré est
  // loggé et une alerte email envoyée en fin de fonction si au moins un bloc a échoué (avant, un
  // console.warn isolé pouvait passer complètement inaperçu en production).
  const migrationIssues = [];

  try {
    const [rows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND TABLE_SCHEMA=DATABASE()");
    const cols = rows.map(r => r.COLUMN_NAME);
    if (!cols.includes('poste')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN poste VARCHAR(50) NULL");
      console.log('[DB] Colonne users.poste ajoutée');
    }
    if (!cols.includes('pied_fort')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN pied_fort ENUM('droit','gauche','ambidextre') NULL");
      console.log('[DB] Colonne users.pied_fort ajoutée');
    }
    if (!cols.includes('taille')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN taille INT NULL");
      console.log('[DB] Colonne users.taille ajoutée');
    }
    if (!cols.includes('email_verified')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0");
      console.log('[DB] Colonne users.email_verified ajoutée');
    }
    if (!cols.includes('email_verify_token')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN email_verify_token VARCHAR(64) NULL");
      console.log('[DB] Colonne users.email_verify_token ajoutée');
    }
    if (!cols.includes('email_verify_expires')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN email_verify_expires DATETIME NULL");
      console.log('[DB] Colonne users.email_verify_expires ajoutée');
    }
    if (!cols.includes('two_fa_enabled')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN two_fa_enabled TINYINT(1) NOT NULL DEFAULT 0");
      console.log('[DB] Colonne users.two_fa_enabled ajoutée');
    }
    if (!cols.includes('two_fa_code')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN two_fa_code VARCHAR(6) NULL");
      console.log('[DB] Colonne users.two_fa_code ajoutée');
    }
    if (!cols.includes('two_fa_expires')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN two_fa_expires DATETIME NULL");
      console.log('[DB] Colonne users.two_fa_expires ajoutée');
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (users) :', e.message);
    migrationIssues.push({ block: 'users', error: e.message });
  }

  // Migrations equipes — genre/format/couleur_maillot/description envoyés par le frontend depuis
  // toujours mais jamais déclarés sur le modèle Sequelize ni la table : silencieusement ignorés
  // à l'écriture, toujours `undefined` à la lecture (ex: "undefinedvundefined" affiché à la place du format).
  try {
    const [eqRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='equipes' AND TABLE_SCHEMA=DATABASE()");
    const eqCols = eqRows.map(r => r.COLUMN_NAME);
    if (!eqCols.includes('genre')) {
      await sequelize.query("ALTER TABLE equipes ADD COLUMN genre ENUM('masculin','feminin','mixte','handisport') NOT NULL DEFAULT 'masculin'");
      console.log('[DB] Colonne equipes.genre ajoutée');
    }
    if (!eqCols.includes('format')) {
      await sequelize.query("ALTER TABLE equipes ADD COLUMN format VARCHAR(10) NOT NULL DEFAULT '11'");
      console.log('[DB] Colonne equipes.format ajoutée');
    }
    if (!eqCols.includes('couleur_maillot')) {
      await sequelize.query("ALTER TABLE equipes ADD COLUMN couleur_maillot VARCHAR(7) NOT NULL DEFAULT '#0f5238'");
      console.log('[DB] Colonne equipes.couleur_maillot ajoutée');
    }
    if (!eqCols.includes('description')) {
      await sequelize.query("ALTER TABLE equipes ADD COLUMN description TEXT NULL");
      console.log('[DB] Colonne equipes.description ajoutée');
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (equipes) :', e.message);
    migrationIssues.push({ block: 'equipes', error: e.message });
  }

  // Migrations matchs
  try {
    const [mRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='matchs' AND TABLE_SCHEMA=DATABASE()");
    const mCols = mRows.map(r => r.COLUMN_NAME);
    if (!mCols.includes('besoin_arbitre')) {
      await sequelize.query("ALTER TABLE matchs ADD COLUMN besoin_arbitre TINYINT(1) NOT NULL DEFAULT 0");
      console.log('[DB] Colonne matchs.besoin_arbitre ajoutée');
    }
    if (!mCols.includes('saison')) {
      await sequelize.query("ALTER TABLE matchs ADD COLUMN saison VARCHAR(20) NULL");
      console.log('[DB] Colonne matchs.saison ajoutée');
    }
    // L'ENUM matchs.type créé en migration 005 ne contient pas 'autre', alors que le modèle Sequelize
    // et matchController.TYPE_MAP (plateau/reunion → autre) s'appuient dessus depuis toujours — tout
    // événement Plateau/Réunion/Autre échouait silencieusement à l'insertion (valeur ENUM invalide).
    const [typeColRows] = await sequelize.query("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='matchs' AND COLUMN_NAME='type' AND TABLE_SCHEMA=DATABASE()");
    const typeColumnType = typeColRows[0]?.COLUMN_TYPE || '';
    if (!typeColumnType.includes("'autre'")) {
      await sequelize.query("ALTER TABLE matchs MODIFY COLUMN type ENUM('match','entrainement','tournoi','amical','coupe','autre') NOT NULL DEFAULT 'match'");
      console.log("[DB] Enum matchs.type élargi avec 'autre'");
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (matchs) :', e.message);
    migrationIssues.push({ block: 'matchs', error: e.message });
  }

  // Migrations match_events
  try {
    const [eRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='match_events' AND TABLE_SCHEMA=DATABASE()");
    const eCols = eRows.map(r => r.COLUMN_NAME);
    if (!eCols.includes('passeur_id')) {
      await sequelize.query("ALTER TABLE match_events ADD COLUMN passeur_id INT NULL");
      console.log('[DB] Colonne match_events.passeur_id ajoutée');
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (match_events) :', e.message);
    migrationIssues.push({ block: 'match_events', error: e.message });
  }

  // Migrations arbitrage_presences
  try {
    const [aRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='arbitrage_presences' AND TABLE_SCHEMA=DATABASE()");
    const aCols = aRows.map(r => r.COLUMN_NAME);
    if (!aCols.includes('match_id')) {
      await sequelize.query("ALTER TABLE arbitrage_presences ADD COLUMN match_id INT NULL");
      console.log('[DB] Colonne arbitrage_presences.match_id ajoutée');
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (arbitrage_presences) :', e.message);
    migrationIssues.push({ block: 'arbitrage_presences', error: e.message });
  }

  // Création table support_tickets si absente
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL,
        club_id      INT NULL,
        sujet        VARCHAR(200) NOT NULL,
        message      TEXT NOT NULL,
        priorite     ENUM('normal','haute','urgent') NOT NULL DEFAULT 'normal',
        statut       ENUM('ouvert','en_cours','resolu','ferme') NOT NULL DEFAULT 'ouvert',
        reponse      TEXT NULL,
        repondu_par  INT NULL,
        createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_support_user (user_id),
        INDEX idx_support_club (club_id),
        INDEX idx_support_statut (statut)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[DB] Table support_tickets OK');
  } catch (e) {
    console.warn('[DB] Migration startup échouée (support_tickets) :', e.message);
    migrationIssues.push({ block: 'support_tickets', error: e.message });
  }

  // Création table promo_codes si absente
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        code         VARCHAR(30) NOT NULL UNIQUE,
        type         ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
        valeur       INT NOT NULL,
        description  VARCHAR(200) NULL,
        max_uses     INT NULL,
        uses_count   INT NOT NULL DEFAULT 0,
        expires_at   DATETIME NULL,
        actif        TINYINT(1) NOT NULL DEFAULT 1,
        created_by   INT NULL,
        createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_promo_actif (actif)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[DB] Table promo_codes OK');

    // Code promo partenaire — idempotent (ne recrée pas s'il existe déjà)
    await sequelize.query(`
      INSERT IGNORE INTO promo_codes (code, type, valeur, description, actif, createdAt, updatedAt)
      VALUES ('CODE-FCLEDOULIEU', 'percent', 20, 'Partenariat FC Le Doulieu', 1, NOW(), NOW())
    `);
  } catch (e) {
    console.warn('[DB] Migration startup échouée (promo_codes) :', e.message);
    migrationIssues.push({ block: 'promo_codes', error: e.message });
  }

  // Création table subscriptions si absente
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id                     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        owner_type             ENUM('club','user') NOT NULL,
        owner_id               INT NOT NULL,
        plan                   ENUM('mensuel','annuel') NOT NULL,
        statut                 ENUM('actif','expire','annule','impaye') NOT NULL DEFAULT 'actif',
        stripe_customer_id     VARCHAR(100) NULL,
        stripe_subscription_id VARCHAR(100) NULL UNIQUE,
        promo_code             VARCHAR(30) NULL,
        current_period_end     DATETIME NULL,
        rappel_envoye          TINYINT(1) NOT NULL DEFAULT 0,
        createdAt              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sub_owner (owner_type, owner_id),
        INDEX idx_sub_statut (statut),
        INDEX idx_sub_period_end (current_period_end)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[DB] Table subscriptions OK');
  } catch (e) {
    console.warn('[DB] Migration startup échouée (subscriptions) :', e.message);
    migrationIssues.push({ block: 'subscriptions', error: e.message });
  }

  // Réécrit les anciennes URLs Drive `uc?export=view` (de plus en plus bloquées par Google en cross-origin)
  // vers l'endpoint `thumbnail`, seul format fiable pour l'affichage direct en <img>.
  try {
    const OLD_PREFIX = 'https://drive.google.com/uc?export=view&id=';
    const NEW_PREFIX = 'https://drive.google.com/thumbnail?id=';
    for (const { table, column } of [
      { table: 'users', column: 'avatar' },
      { table: 'clubs', column: 'logo' },
      { table: 'messages', column: 'fichier_url' },
    ]) {
      const [result] = await sequelize.query(
        `UPDATE \`${table}\` SET \`${column}\` = CONCAT(REPLACE(\`${column}\`, ?, ?), '&sz=w1000') WHERE \`${column}\` LIKE ?`,
        { replacements: [OLD_PREFIX, NEW_PREFIX, `${OLD_PREFIX}%`] }
      );
      if (result?.affectedRows) console.log(`[DB] ${result.affectedRows} URL(s) Drive migrées (${table}.${column})`);
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (URLs Drive) :', e.message);
    migrationIssues.push({ block: 'URLs Drive', error: e.message });
  }

  // Migration clubs.slug — identifiant lisible pour les URLs publiques (/resultats-club/:slug),
  // évite d'exposer l'id numérique séquentiel (énumérable) sur une page non authentifiée.
  try {
    const [clRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='clubs' AND TABLE_SCHEMA=DATABASE()");
    const clCols = clRows.map(r => r.COLUMN_NAME);
    if (!clCols.includes('slug')) {
      await sequelize.query("ALTER TABLE clubs ADD COLUMN slug VARCHAR(220) NULL UNIQUE");
      console.log('[DB] Colonne clubs.slug ajoutée');
    }
    const { Club } = require('./models');
    const { slugify } = require('./utils/slugify');
    const clubsSansSlug = await Club.findAll({ where: { slug: null } });
    for (const club of clubsSansSlug) {
      const base = slugify(club.nom) || `club-${club.id}`;
      let slug = base, n = 2;
      while (await Club.findOne({ where: { slug } })) { slug = `${base}-${n}`; n++; }
      await club.update({ slug });
      console.log(`[DB] Slug généré pour le club #${club.id} : ${slug}`);
    }
  } catch (e) {
    console.warn('[DB] Migration startup échouée (clubs.slug) :', e.message);
    migrationIssues.push({ block: 'clubs.slug', error: e.message });
  }

  // ── Résumé structuré + alerte ────────────────────────────────────────────
  if (migrationIssues.length > 0) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'startup_migrations_failed',
      count: migrationIssues.length,
      issues: migrationIssues,
      timestamp: new Date().toISOString(),
    }));
    const { sendAdminAlert } = require('./services/emailService');
    const summary = migrationIssues.map(i => `- ${i.block} : ${i.error}`).join('\n');
    // Fire-and-forget : un échec d'envoi d'alerte ne doit jamais retarder/bloquer le démarrage.
    sendAdminAlert({
      subject: `${migrationIssues.length} migration(s) de démarrage en échec`,
      message: `Le serveur MonClubHouse a démarré le ${new Date().toISOString()}, mais ${migrationIssues.length} migration(s) automatique(s) ont échoué :\n\n${summary}\n\nDes colonnes ou tables peuvent être manquantes — vérifier manuellement la base de données.`,
    }).catch(() => {});
  } else {
    console.log(JSON.stringify({
      level: 'info',
      event: 'startup_migrations_complete',
      timestamp: new Date().toISOString(),
    }));
  }
};

const connectDB = async (retries = 10, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('[DB] Connexion MySQL réussie');
      await applyStartupMigrations();
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

    // Cron rappels de renouvellement d'abonnement — une fois par jour
    const { createRenewalReminders } = require('./services/subscriptionService');
    cron.schedule('0 8 * * *', async () => {
      try { await createRenewalReminders(); }
      catch (e) { console.error('[Cron rappels abonnement]', e.message); }
    });
    console.log('[Cron] Rappels renouvellement abonnement planifiés (quotidien 8h)');
  } catch (e) {
    console.warn('[Cron] node-cron non disponible :', e.message);
  }
});

module.exports = { app, io };
