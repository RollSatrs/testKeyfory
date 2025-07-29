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
  price: { type: DataTypes.FLOAT, defaultValue: 0 }, // цена услуги
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
  status: { type: DataTypes.STRING, defaultValue: 'inactive' },
  balance: { type: DataTypes.FLOAT, defaultValue: 0 }, // баланс исполнителя
  access_rights: { type: DataTypes.JSON }, // права доступа к услугам
  last_activity: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }, // последняя активность
  create_date_executer: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'executers', timestamps: false });

// Логи действий
export const Log = sequelize.define('Log', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER }, // ID пользователя (админ или исполнитель)
  user_type: { type: DataTypes.STRING }, // 'admin' или 'executer'
  action: { type: DataTypes.STRING }, // тип действия
  description: { type: DataTypes.TEXT }, // описание действия
  order_id: { type: DataTypes.INTEGER, allowNull: true }, // ID заказа (если применимо)
  service_id: { type: DataTypes.INTEGER, allowNull: true }, // ID услуги (если применимо)
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'logs', timestamps: false });

// Права доступа к услугам
export const ServiceAccess = sequelize.define('ServiceAccess', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' } },
  service_id: { type: DataTypes.INTEGER, references: { model: 'services', key: 'id' } },
  has_access: { type: DataTypes.BOOLEAN, defaultValue: true },
  can_replace_materials: { type: DataTypes.BOOLEAN, defaultValue: false }, // может ли заменять материалы
  requires_approval: { type: DataTypes.BOOLEAN, defaultValue: true }, // требуется ли одобрение для замены
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'service_access', timestamps: false });

// Запросы на замену материалов
export const MaterialReplacement = sequelize.define('MaterialReplacement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, references: { model: 'orders', key: 'id' }, allowNull: false },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' }, allowNull: false },
  material_id: { type: DataTypes.INTEGER, references: { model: 'material', key: 'id' }, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false }, // причина замены
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, approved, rejected
  admin_response: { type: DataTypes.TEXT, allowNull: true }, // ответ администратора
  processed_by: { type: DataTypes.INTEGER, references: { model: 'admins', key: 'id' }, allowNull: true },
  processed_at: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'material_replacements', timestamps: false });

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

// Новые связи
Executer.hasMany(ServiceAccess, {foreignKey: 'executer_id'});
ServiceAccess.belongsTo(Executer, {foreignKey: 'executer_id'});

Services.hasMany(ServiceAccess, {foreignKey: 'service_id'});
ServiceAccess.belongsTo(Services, {foreignKey: 'service_id'});

// Связи для запросов на замену материалов
Order.hasMany(MaterialReplacement, {foreignKey: 'order_id'});
MaterialReplacement.belongsTo(Order, {foreignKey: 'order_id'});

Executer.hasMany(MaterialReplacement, {foreignKey: 'executer_id'});
MaterialReplacement.belongsTo(Executer, {foreignKey: 'executer_id'});

Material.hasMany(MaterialReplacement, {foreignKey: 'material_id'});
MaterialReplacement.belongsTo(Material, {foreignKey: 'material_id'});

Admin.hasMany(MaterialReplacement, {foreignKey: 'processed_by'});
MaterialReplacement.belongsTo(Admin, {foreignKey: 'processed_by'});

// Индивидуальное ценообразование для исполнителей
export const ExecuterPricing = sequelize.define('ExecuterPricing', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' }, allowNull: false },
  service_id: { type: DataTypes.INTEGER, references: { model: 'services', key: 'id' }, allowNull: false },
  custom_price: { type: DataTypes.FLOAT, allowNull: false }, // индивидуальная цена для исполнителя
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'executer_pricing', timestamps: false });

// Связи для ценообразования
Executer.hasMany(ExecuterPricing, {foreignKey: 'executer_id'});
ExecuterPricing.belongsTo(Executer, {foreignKey: 'executer_id'});

Services.hasMany(ExecuterPricing, {foreignKey: 'service_id'});
ExecuterPricing.belongsTo(Services, {foreignKey: 'service_id'});

// Связи для логов
Executer.hasMany(Log, {foreignKey: 'user_id', constraints: false, scope: { user_type: 'executer' }});
Log.belongsTo(Executer, {foreignKey: 'user_id', constraints: false});

Order.hasMany(Log, {foreignKey: 'order_id'});
Log.belongsTo(Order, {foreignKey: 'order_id'});

Services.hasMany(Log, {foreignKey: 'service_id'});
Log.belongsTo(Services, {foreignKey: 'service_id'});