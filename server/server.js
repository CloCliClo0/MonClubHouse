require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

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
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'https://monclubhouse.fr',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Enregistrer le handler Socket.io
require('./sockets/chatSocket')(io);

// Rendre io accessible dans les controllers
app.set('io', io);

// Middlewares globaux
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'wss://monclubhouse.fr', 'https://monclubhouse.fr']
    }
  }
}));

app.use(cors({
  origin: process.env.APP_URL || 'https://monclubhouse.fr',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Fichiers statiques (client séparé)
const CLIENT_PATH = path.join(__dirname, '..', 'client');
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
app.use('/api/admin', adminRoutes);

// Auth Google (hors /api pour le redirect OAuth)
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: process.env.APP_NAME, env: process.env.NODE_ENV });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route introuvable' });
  }
  res.sendFile(path.join(CLIENT_PATH, 'index.html'));
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

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connexion MySQL réussie');

    // Synchronisation en dev uniquement (utiliser migrations en prod)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('[DB] Modèles synchronisés');
    }

    server.listen(PORT, () => {
      console.log(`[Server] MonClubHouse démarré sur le port ${PORT}`);
      console.log(`[Server] URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
    });
  } catch (err) {
    console.error('[Server] Erreur démarrage:', err);
    process.exit(1);
  }
};

start();

module.exports = { app, io };
