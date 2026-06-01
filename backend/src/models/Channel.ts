import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface ChannelAttributes {
  id: number;
  club_id: number;
  equipe_id: number | null;
  nom: string;
  description: string | null;
  type: 'general' | 'equipe' | 'prive';
  role_minimum: string;
  actif: boolean;
}

type ChannelCreation = Optional<ChannelAttributes, 'id' | 'equipe_id' | 'description'>;

class Channel extends Model<ChannelAttributes, ChannelCreation> implements ChannelAttributes {
  declare id: number;
  declare club_id: number;
  declare equipe_id: number | null;
  declare nom: string;
  declare description: string | null;
  declare type: 'general' | 'equipe' | 'prive';
  declare role_minimum: string;
  declare actif: boolean;
}

Channel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    club_id: { type: DataTypes.INTEGER, allowNull: false },
    equipe_id: { type: DataTypes.INTEGER, allowNull: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('general', 'equipe', 'prive'), defaultValue: 'general' },
    role_minimum: { type: DataTypes.STRING(20), defaultValue: 'visiteur' },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'channels' }
);

export default Channel;
