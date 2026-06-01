import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';
import type { ConvocationStatut } from '../types';

interface ConvocationAttributes {
  id: number;
  match_id: number;
  user_id: number;
  statut: ConvocationStatut;
  commentaire: string | null;
  heure_rdv: string | null;
  lieu_rdv: string | null;
}

type ConvocationCreation = Optional<ConvocationAttributes, 'id' | 'commentaire' | 'heure_rdv' | 'lieu_rdv'>;

class Convocation extends Model<ConvocationAttributes, ConvocationCreation> implements ConvocationAttributes {
  declare id: number;
  declare match_id: number;
  declare user_id: number;
  declare statut: ConvocationStatut;
  declare commentaire: string | null;
  declare heure_rdv: string | null;
  declare lieu_rdv: string | null;
}

Convocation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    statut: {
      type: DataTypes.ENUM('convoque', 'present', 'absent', 'incertain', 'non_retenu'),
      allowNull: false,
      defaultValue: 'convoque',
    },
    commentaire: { type: DataTypes.TEXT, allowNull: true },
    heure_rdv: { type: DataTypes.STRING(5), allowNull: true },
    lieu_rdv: { type: DataTypes.STRING(200), allowNull: true },
  },
  { sequelize, tableName: 'convocations' }
);

export default Convocation;
