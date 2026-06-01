import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface SportAttributes {
  id: number;
  nom: string;
  code: string;
  icone: string | null;
}

type SportCreation = Optional<SportAttributes, 'id' | 'icone'>;

class Sport extends Model<SportAttributes, SportCreation> implements SportAttributes {
  declare id: number;
  declare nom: string;
  declare code: string;
  declare icone: string | null;
}

Sport.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    icone: { type: DataTypes.STRING(100), allowNull: true },
  },
  { sequelize, tableName: 'sports' }
);

export default Sport;
