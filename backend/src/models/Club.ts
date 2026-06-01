import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface ClubAttributes {
  id: number;
  nom: string;
  logo: string | null;
  description: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  reseaux_sociaux: Record<string, string>;
  couleur_primaire: string;
  couleur_secondaire: string;
  numero_affiliation: string | null;
  actif: boolean;
}

type ClubCreation = Optional<ClubAttributes, 'id' | 'logo' | 'description' | 'adresse' | 'ville' | 'code_postal' | 'telephone' | 'email' | 'site_web' | 'numero_affiliation'>;

class Club extends Model<ClubAttributes, ClubCreation> implements ClubAttributes {
  declare id: number;
  declare nom: string;
  declare logo: string | null;
  declare description: string | null;
  declare adresse: string | null;
  declare ville: string | null;
  declare code_postal: string | null;
  declare telephone: string | null;
  declare email: string | null;
  declare site_web: string | null;
  declare reseaux_sociaux: Record<string, string>;
  declare couleur_primaire: string;
  declare couleur_secondaire: string;
  declare numero_affiliation: string | null;
  declare actif: boolean;
}

Club.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(200), allowNull: false },
    logo: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    adresse: { type: DataTypes.STRING(500), allowNull: true },
    ville: { type: DataTypes.STRING(100), allowNull: true },
    code_postal: { type: DataTypes.STRING(10), allowNull: true },
    telephone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    site_web: { type: DataTypes.STRING(500), allowNull: true },
    reseaux_sociaux: { type: DataTypes.JSON, defaultValue: {} },
    couleur_primaire: { type: DataTypes.STRING(7), defaultValue: '#2d6a4f' },
    couleur_secondaire: { type: DataTypes.STRING(7), defaultValue: '#ffffff' },
    numero_affiliation: { type: DataTypes.STRING(50), allowNull: true },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'clubs' }
);

export default Club;
