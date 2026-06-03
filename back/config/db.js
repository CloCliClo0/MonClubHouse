const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Hostinger héberge MySQL via socket Unix — on évite la connexion TCP
// qui est refusée depuis 127.0.0.1 par les droits du user MySQL.
// Ordre de priorité pour le socket :
//   1. DB_SOCKET (variable d'env personnalisée)
//   2. /var/run/mysqld/mysqld.sock  (Ubuntu/Debian — Hostinger standard)
//   3. /tmp/mysql.sock              (fallback)
const { existsSync } = require('fs');

function resolveSocket() {
  if (process.env.DB_SOCKET) return process.env.DB_SOCKET;
  const candidates = [
    '/var/run/mysqld/mysqld.sock',
    '/tmp/mysql.sock',
    '/var/lib/mysql/mysql.sock',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

const socketPath = resolveSocket();

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
};

if (socketPath) {
  console.log(`[DB] Connexion via socket : ${socketPath}`);
  sequelizeOptions.dialectOptions = { socketPath };
} else {
  console.log(`[DB] Connexion via TCP : ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
  sequelizeOptions.host = process.env.DB_HOST || 'localhost';
  sequelizeOptions.port = parseInt(process.env.DB_PORT || '3306');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions
);

module.exports = sequelize;
