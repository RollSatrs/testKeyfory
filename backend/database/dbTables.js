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
  loading_method: { type: DataTypes.STRING, defaultValue: 'manual' }, // способ загрузки материалов
  status: { type: DataTypes.STRING },
  executer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'executers',
      key: 'id'
    }
  },
  admin_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // Soft delete флаг
  deleted_at: { type: DataTypes.DATE, allowNull: true }, // Дата удаления
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  }, // ID администратора, который удалил
  archived_name: { type: DataTypes.STRING, allowNull: true }, // Сохраненное имя на момент архивации
  archived_category: { type: DataTypes.STRING, allowNull: true }, // Сохраненная категория на момент архивации
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
  is_used: { type: DataTypes.BOOLEAN, defaultValue: false }, // Флаг использования материала
  used_reason: { type: DataTypes.STRING, allowNull: true }, // Причина использования
  source: { type: DataTypes.STRING }, // API склада или ручная загрузка
  added_date: { type: DataTypes.DATE },
  used_date: { type: DataTypes.DATE },
  replacement_requested_date: { type: DataTypes.DATE }, // Дата запроса замены
  order_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  order_number: { type: DataTypes.STRING, allowNull: true }, // Номер заказа
  executer_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'executers',
      key: 'id'
    },
    allowNull: true
  }, // ID исполнителя
  executer_name: { type: DataTypes.STRING, allowNull: true }, // Имя исполнителя
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

// Связь для soft delete
Admin.hasMany(Services, {foreignKey: 'deleted_by', as: 'deletedServices'});
Services.belongsTo(Admin, {foreignKey: 'deleted_by', as: 'deletedBy'});

Services.hasMany(Material, {foreignKey: 'service_id'});
Material.belongsTo(Services, {foreignKey: 'service_id', as: 'Service'});

Order.hasMany(Material, {foreignKey: 'order_id'});
Material.belongsTo(Order, {foreignKey: 'order_id'});

Executer.hasMany(Material, {foreignKey: 'executer_id'});
Material.belongsTo(Executer, {foreignKey: 'executer_id', as: 'Executer'});

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

// Заработок исполнителей
export const ExecuterEarnings = sequelize.define('ExecuterEarnings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' }, allowNull: false },
  service_id: { type: DataTypes.INTEGER, references: { model: 'services', key: 'id' }, allowNull: false },
  order_id: { type: DataTypes.INTEGER, references: { model: 'orders', key: 'id' }, allowNull: true },
  amount: { type: DataTypes.FLOAT, allowNull: false }, // сумма заработка
  base_price: { type: DataTypes.FLOAT, allowNull: false }, // базовая цена услуги
  custom_price: { type: DataTypes.FLOAT, allowNull: true }, // индивидуальная цена (если есть)
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, paid, cancelled
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'executer_earnings', timestamps: false, freezeTableName: true });

// Индивидуальное ценообразование для исполнителей
export const ExecuterPricing = sequelize.define('ExecuterPricing', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' }, allowNull: false },
  service_id: { type: DataTypes.INTEGER, references: { model: 'services', key: 'id' }, allowNull: false },
  custom_price: { type: DataTypes.FLOAT, allowNull: false }, // индивидуальная цена для исполнителя
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'executer_pricing', timestamps: false });

// Выполнение услуг (новая архитектура заказов)
export const ServiceExecution = sequelize.define('ServiceExecution', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: { type: DataTypes.INTEGER, references: { model: 'services', key: 'id' }, allowNull: false },
  executer_id: { type: DataTypes.INTEGER, references: { model: 'executers', key: 'id' }, allowNull: false },
  order_number: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 }, // цена за выполнение услуги
  material_contents: { type: DataTypes.TEXT, allowNull: true }, // содержимое использованного материала
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, in_progress, completed, cancelled
  started_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  cancelled_at: { type: DataTypes.DATE, allowNull: true },
  cancel_reason: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'service_executions', timestamps: false });

// Связи для ценообразования
Executer.hasMany(ExecuterPricing, {foreignKey: 'executer_id'});
ExecuterPricing.belongsTo(Executer, {foreignKey: 'executer_id'});

Services.hasMany(ExecuterPricing, {foreignKey: 'service_id'});
ExecuterPricing.belongsTo(Services, {foreignKey: 'service_id'});

// Связь Services с Executer (назначенный исполнитель)
Services.belongsTo(Executer, {foreignKey: 'executer_id', as: 'assignedExecuter'});
Executer.hasMany(Services, {foreignKey: 'executer_id', as: 'assignedServices'});

// Связи для заработка исполнителей
Executer.hasMany(ExecuterEarnings, {foreignKey: 'executer_id'});
ExecuterEarnings.belongsTo(Executer, {foreignKey: 'executer_id'});

Order.hasMany(ExecuterEarnings, {foreignKey: 'order_id'});
ExecuterEarnings.belongsTo(Order, {foreignKey: 'order_id'});

Services.hasMany(ExecuterEarnings, {foreignKey: 'service_id'});
ExecuterEarnings.belongsTo(Services, {foreignKey: 'service_id'});

// Связи для логов
Executer.hasMany(Log, {foreignKey: 'user_id', constraints: false, scope: { user_type: 'executer' }});
Log.belongsTo(Executer, {foreignKey: 'user_id', constraints: false});

Order.hasMany(Log, {foreignKey: 'order_id'});
Log.belongsTo(Order, {foreignKey: 'order_id'});

Services.hasMany(Log, {foreignKey: 'service_id'});
Log.belongsTo(Services, {foreignKey: 'service_id'});

// Связи для ServiceExecution
Services.hasMany(ServiceExecution, {foreignKey: 'service_id', as: 'ServiceExecutions'});
ServiceExecution.belongsTo(Services, {foreignKey: 'service_id', as: 'Service'});

Executer.hasMany(ServiceExecution, {foreignKey: 'executer_id', as: 'ServiceExecutions'});
ServiceExecution.belongsTo(Executer, {foreignKey: 'executer_id', as: 'Executer'});

// Связи для MaterialReplacement с ServiceExecution
ServiceExecution.hasMany(MaterialReplacement, {foreignKey: 'service_execution_id', as: 'MaterialReplacements'});
MaterialReplacement.belongsTo(ServiceExecution, {foreignKey: 'service_execution_id', as: 'ServiceExecution'});