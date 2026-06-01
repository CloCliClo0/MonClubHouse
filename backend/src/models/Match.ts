import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';
import type { MatchType, MatchStatut } from '../types';

interface MatchAttributes {
  id: number;
  equipe_id: number;
  club_id: number;
  terrain_id: number | null;
  adversaire: string | null;
  type: MatchType;
  statut: MatchStatut;
  date_match: Date;
  lieu: 'domicile' | 'exterieur' | 'neutre';
  score_domicile: number | null;
  score_exterieur: number | null;
  description: string | null;
  rapport_match: string | null;
  cree_par: number;
}

type MatchCreation = Optional<MatchAttributes, 'id' | 'terrain_id' | 'adversaire' | 'description' | 'rapport_match' | 'score_domicile' | 'score_exterieur'>;

class Match extends Model<MatchAttributes, MatchCreation> implements MatchAttributes {
  declare id: number;
  declare equipe_id: number;
  declare club_id: number;
  declare terrain_id: number | null;
  declare adversaire: string | null;
  declare type: MatchType;
  declare statut: MatchStatut;
  declare date_match: Date;
  declare lieu: 'domicile' | 'exterieur' | 'neutre';
  declare score_domicile: number | null;
  declare score_exterieur: number | null;
  declare description: string | null;
  declare rapport_match: string | null;
  declare cree_par: number;
}

Match.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    equipe_id: { type: DataTypes.INTEGER, allowNull: false },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    terrain_id: { type: DataTypes.INTEGER, allowNull: true },
    adversaire: { type: DataTypes.STRING(200), allowNull: true },
    type: {
      type: DataTypes.ENUM('match', 'entrainement', 'tournoi', 'amical', 'coupe'),
      allowNull: false,
      defaultValue: 'match',
    },
    statut: {
      type: DataTypes.ENUM('programme', 'en_cours', 'termine', 'annule', 'reporte'),
      allowNull: false,
      defaultValue: 'programme',
    },
    date_match: { type: DataTypes.DATE, allowNull: false },
    lieu: { type: DataTypes.ENUM('domicile', 'exterieur', 'neutre'), defaultValue: 'domicile' },
    score_domicile: { type: DataTypes.INTEGER, allowNull: true },
    score_exterieur: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    rapport_match: { type: DataTypes.TEXT, allowNull: true },
    cree_par: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'matchs' }
);

export default Match;
