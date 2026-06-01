import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface NotificationAttributes {
  id: number;
  user_id: number;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  lu: boolean;
  donnees: Record<string, unknown>;
}

type NotificationCreation = Optional<NotificationAttributes, 'id' | 'lien'>;

class Notification extends Model<NotificationAttributes, NotificationCreation> implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare type: string;
  declare titre: string;
  declare message: string;
  declare lien: string | null;
  declare lu: boolean;
  declare donnees: Record<string, unknown>;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    titre: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    lien: { type: DataTypes.STRING(500), allowNull: true },
    lu: { type: DataTypes.BOOLEAN, defaultValue: false },
    donnees: { type: DataTypes.JSON, defaultValue: {} },
  },
  { sequelize, tableName: 'notifications' }
);

export default Notification;
