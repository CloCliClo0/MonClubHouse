import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface TerrainAttributes {
  id: number;
  club_id: number;
  nom: string;
  adresse: string | null;
  capacite: number | null;
  type_surface: string | null;
  eclairage: boolean;
  actif: boolean;
}

type TerrainCreation = Optional<TerrainAttributes, 'id' | 'adresse' | 'capacite' | 'type_surface'>;

class Terrain extends Model<TerrainAttributes, TerrainCreation> implements TerrainAttributes {
  declare id: number;
  declare club_id: number;
  declare nom: string;
  declare adresse: string | null;
  declare capacite: number | null;
  declare type_surface: string | null;
  declare eclairage: boolean;
  declare actif: boolean;
}

Terrain.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    nom: { type: DataTypes.STRING(200), allowNull: false },
    adresse: { type: DataTypes.STRING(500), allowNull: true },
    capacite: { type: DataTypes.INTEGER, allowNull: true },
    type_surface: { type: DataTypes.STRING(50), allowNull: true },
    eclairage: { type: DataTypes.BOOLEAN, defaultValue: false },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'terrains' }
);

export default Terrain;
