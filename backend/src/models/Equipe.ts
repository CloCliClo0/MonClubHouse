import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface EquipeAttributes {
  id: number;
  club_id: number;
  sport_id: number;
  nom: string;
  categorie: string;
  genre: 'masculin' | 'feminin' | 'mixte';
  saison: string;
  coach_id: number | null;
  couleur_maillot: string | null;
  actif: boolean;
}

type EquipeCreation = Optional<EquipeAttributes, 'id' | 'coach_id' | 'couleur_maillot'>;

class Equipe extends Model<EquipeAttributes, EquipeCreation> implements EquipeAttributes {
  declare id: number;
  declare club_id: number;
  declare sport_id: number;
  declare nom: string;
  declare categorie: string;
  declare genre: 'masculin' | 'feminin' | 'mixte';
  declare saison: string;
  declare coach_id: number | null;
  declare couleur_maillot: string | null;
  declare actif: boolean;
}

Equipe.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    sport_id: { type: DataTypes.INTEGER, allowNull: false },
    nom: { type: DataTypes.STRING(200), allowNull: false },
    categorie: { type: DataTypes.STRING(50), allowNull: false },
    genre: { type: DataTypes.ENUM('masculin', 'feminin', 'mixte'), defaultValue: 'masculin' },
    saison: { type: DataTypes.STRING(9), allowNull: false },
    coach_id: { type: DataTypes.INTEGER, allowNull: true },
    couleur_maillot: { type: DataTypes.STRING(7), allowNull: true },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'equipes' }
);

export default Equipe;
