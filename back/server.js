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
app.use('/api/categories',   categoriesRoutes);
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

const connectDB = async (retries = 10, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('[DB] Connexion MySQL réussie');
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
