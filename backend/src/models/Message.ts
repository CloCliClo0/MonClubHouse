import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface MessageAttributes {
  id: number;
  channel_id: number;
  user_id: number;
  contenu: string;
  type: 'texte' | 'image' | 'fichier' | 'systeme';
  fichier_url: string | null;
  modifie: boolean;
  supprime: boolean;
}

type MessageCreation = Optional<MessageAttributes, 'id' | 'fichier_url'>;

class Message extends Model<MessageAttributes, MessageCreation> implements MessageAttributes {
  declare id: number;
  declare channel_id: number;
  declare user_id: number;
  declare contenu: string;
  declare type: 'texte' | 'image' | 'fichier' | 'systeme';
  declare fichier_url: string | null;
  declare modifie: boolean;
  declare supprime: boolean;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    channel_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    contenu: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM('texte', 'image', 'fichier', 'systeme'), defaultValue: 'texte' },
    fichier_url: { type: DataTypes.STRING(500), allowNull: true },
    modifie: { type: DataTypes.BOOLEAN, defaultValue: false },
    supprime: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'messages' }
);

export default Message;
