import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db';
import type { Role } from '../types';

interface UserAttributes {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password_hash: string | null;
  role: Role;
  club_id: number | null;
  parent_id: number | null;
  google_id: string | null;
  refresh_token: string | null;
  avatar: string | null;
  telephone: string | null;
  date_naissance: string | null;
  actif: boolean;
  derniere_connexion: Date | null;
  notif_email: boolean;
  notif_push: boolean;
}

type UserCreation = Optional<UserAttributes, 'id' | 'password_hash' | 'club_id' | 'parent_id' | 'google_id' | 'refresh_token' | 'avatar' | 'telephone' | 'date_naissance' | 'derniere_connexion'>;

class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: number;
  declare nom: string;
  declare prenom: string;
  declare email: string;
  declare password_hash: string | null;
  declare role: Role;
  declare club_id: number | null;
  declare parent_id: number | null;
  declare google_id: string | null;
  declare refresh_token: string | null;
  declare avatar: string | null;
  declare telephone: string | null;
  declare date_naissance: string | null;
  declare actif: boolean;
  declare derniere_connexion: Date | null;
  declare notif_email: boolean;
  declare notif_push: boolean;

  async verifyPassword(password: string): Promise<boolean> {
    if (!this.password_hash) return false;
    return bcrypt.compare(password, this.password_hash);
  }

  toSafeJSON(): Record<string, unknown> {
    const v = this.toJSON() as Record<string, unknown>;
    delete v.password_hash;
    delete v.refresh_token;
    return v;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    role: {
      type: DataTypes.ENUM('superadmin','admin','dirigeant','coach','joueur','parent','visiteur'),
      defaultValue: 'joueur',
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
  },
  {
    sequelize,
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
      },
    },
  }
);

export default User;
