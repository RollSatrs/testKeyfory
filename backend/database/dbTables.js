import bcrypt from 'bcrypt';
import {sequelize} from './databaseOn.js'
import { DataTypes } from 'sequelize';

// Админы
export const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  telegramId: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'admins', timestamps: false });

// Услуги
export const Services = sequelize.define('Services',{
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT }, // описание услуги
  category: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT }, // цена услуги
  required_keys: { type: DataTypes.INTEGER, defaultValue: 1 }, // сколько ключей нужно для услуги
  status: { type: DataTypes.STRING },
  admin_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  create_date_service: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'services', timestamps: true });

// Материалы
export const Material = sequelize.define('Material',{
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type_key: { type: DataTypes.STRING },
  service_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  contents: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING }, // API склада или ручная загрузка
  added_date: { type: DataTypes.DATE },
  used_date: { type: DataTypes.DATE },
  order_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  create_date_material: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'material', timestamps: true });

// Заказы
export const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  performer_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'performers',
      key: 'id'
    }
  },
  customer_telegram_id: { type: DataTypes.STRING, allowNull: true }, // поле для клиента (может быть null для старых записей)
  description: { type: DataTypes.TEXT }, // описание заказа
  contact_info: { type: DataTypes.STRING }, // контактная информация
  amount: { type: DataTypes.FLOAT }, // сумма заказа
  product_keys: { type: DataTypes.TEXT }, // ключи продукта
  price: { type: DataTypes.FLOAT },
  source: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  create_date_order: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'orders', timestamps: true });

// Исполнители
export const Performer = sequelize.define('Performer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  telegramId: { type: DataTypes.STRING, unique: true, allowNull: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING },
  create_date_performer: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'performers', timestamps: false });

// Связи
Admin.hasMany(Services, {foreignKey: 'admin_id'});
Services.belongsTo(Admin, {foreignKey: 'admin_id'});

Services.hasMany(Material, {foreignKey: 'service_id'});
Material.belongsTo(Services, {foreignKey: 'service_id'});

Order.hasMany(Material, {foreignKey: 'order_id'});
Material.belongsTo(Order, {foreignKey: 'order_id'});

Services.hasMany(Order, {foreignKey: 'service_id'});
Order.belongsTo(Services, {foreignKey: 'service_id'});

Performer.hasMany(Order, {foreignKey: 'performer_id'});
Order.belongsTo(Performer, {foreignKey: 'performer_id'});