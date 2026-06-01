import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface LicencieAttributes {
  id: number;
  user_id: number;
  equipe_id: number;
  club_id: number;
  numero_licence: string | null;
  poste: string | null;
  numero_maillot: number | null;
  date_inscription: Date;
  actif: boolean;
}

type LicencieCreation = Optional<LicencieAttributes, 'id' | 'numero_licence' | 'poste' | 'numero_maillot'>;

class Licencie extends Model<LicencieAttributes, LicencieCreation> implements LicencieAttributes {
  declare id: number;
  declare user_id: number;
  declare equipe_id: number;
  declare club_id: number;
  declare numero_licence: string | null;
  declare poste: string | null;
  declare numero_maillot: number | null;
  declare date_inscription: Date;
  declare actif: boolean;
}

Licencie.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    equipe_id: { type: DataTypes.INTEGER, allowNull: false },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    numero_licence: { type: DataTypes.STRING(50), allowNull: true },
    poste: { type: DataTypes.STRING(50), allowNull: true },
    numero_maillot: { type: DataTypes.INTEGER, allowNull: true },
    date_inscription: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'licencies' }
);

export default Licencie;
