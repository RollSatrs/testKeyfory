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
  executer_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'executers',
      key: 'id'
    }
  },
  total_sum: { type: DataTypes.FLOAT }, // сумма заказа
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // статус заказа
  payment_status: { type: DataTypes.STRING, defaultValue: 'pending' }, // статус оплаты
  details: { type: DataTypes.JSON }, // дополнительные детали заказа (включая материалы)
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'orders', timestamps: false });

// Исполнители
export const Executer = sequelize.define('Executer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: true }, // имя исполнителя
  telegram_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING },
  create_date_executer: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'executers', timestamps: false });

// Связи
Admin.hasMany(Services, {foreignKey: 'admin_id'});
Services.belongsTo(Admin, {foreignKey: 'admin_id'});

Services.hasMany(Material, {foreignKey: 'service_id'});
Material.belongsTo(Services, {foreignKey: 'service_id'});

Order.hasMany(Material, {foreignKey: 'order_id'});
Material.belongsTo(Order, {foreignKey: 'order_id'});

Services.hasMany(Order, {foreignKey: 'service_id'});
Order.belongsTo(Services, {foreignKey: 'service_id'});

Executer.hasMany(Order, {foreignKey: 'executer_id'});
Order.belongsTo(Executer, {foreignKey: 'executer_id'});