const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Sur Hostinger, MySQL écoute via socket Unix — on évite TCP/IP (127.0.0.1)
// qui nécessite des droits distincts. Le socket bypasse ce problème.
const SOCKET_PATH = process.env.DB_SOCKET || '/var/lib/mysql/mysql.sock';
const USE_SOCKET  = !process.env.DB_HOST || process.env.DB_HOST === 'localhost';

const sequelizeOptions = {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
};

if (USE_SOCKET) {
  // Connexion par socket Unix (Hostinger shared hosting)
  sequelizeOptions.dialectOptions = { socketPath: SOCKET_PATH };
} else {
  // Connexion TCP (ex: 127.0.0.1 ou hôte distant)
  sequelizeOptions.host = process.env.DB_HOST;
  sequelizeOptions.port = parseInt(process.env.DB_PORT || '3306');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions
);

module.exports = sequelize;
