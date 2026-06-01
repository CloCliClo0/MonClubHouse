import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface CompositionAttributes {
  id: number;
  match_id: number;
  user_id: number;
  poste: string;
  numero_maillot: number | null;
  titulaire: boolean;
  ordre: number | null;
}

type CompositionCreation = Optional<CompositionAttributes, 'id' | 'numero_maillot' | 'ordre'>;

class Composition extends Model<CompositionAttributes, CompositionCreation> implements CompositionAttributes {
  declare id: number;
  declare match_id: number;
  declare user_id: number;
  declare poste: string;
  declare numero_maillot: number | null;
  declare titulaire: boolean;
  declare ordre: number | null;
}

Composition.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    poste: { type: DataTypes.STRING(50), allowNull: false },
    numero_maillot: { type: DataTypes.INTEGER, allowNull: true },
    titulaire: { type: DataTypes.BOOLEAN, defaultValue: true },
    ordre: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'compositions' }
);

export default Composition;
