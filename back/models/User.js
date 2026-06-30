const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  prenom: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: true },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur'),
    defaultValue: 'joueur'
  },
  club_id: { type: DataTypes.INTEGER, allowNull: true },
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  google_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  refresh_token: { type: DataTypes.TEXT, allowNull: true },
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  telephone: { type: DataTypes.STRING(20), allowNull: true },
  date_naissance: { type: DataTypes.DATEONLY, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  derniere_connexion: { type: DataTypes.DATE, allowNull: true },
  notif_email: { type: DataTypes.BOOLEAN, defaultValue: true },
  notif_push: { type: DataTypes.BOOLEAN, defaultValue: true },
  pied_fort: { type: DataTypes.ENUM('droit', 'gauche', 'ambidextre'), allowNull: true },
  poste: { type: DataTypes.STRING(50), allowNull: true },
  taille: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

User.prototype.verifyPassword = async function(password) {
  if (!this.password_hash) return false;
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.toSafeJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  delete values.refresh_token;
  return values;
};

module.exports = User;
