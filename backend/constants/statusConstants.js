// Константы статусов и типов для использования в backend
// Здесь хранятся ТОЛЬКО английские значения для базы данных

// Статусы услуг
export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Статусы материалов (русские значения для базы данных)
export const MATERIAL_STATUS = {
  AVAILABLE: 'доступен',
  USED: 'использован',
  REPLACED: 'заменен',
  PENDING_REPLACE: 'pending_replace',
  IN_USE: 'in_use'
};

// Статусы заказов
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  AWAITING_PAYMENT: 'awaiting_payment'
};

// Статусы оплаты
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Статусы исполнителей
export const EXECUTER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BUSY: 'busy',
  BLOCKED: 'blocked'
};

// Статусы запросов на замену материалов
export const REPLACEMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Типы действий в логах
export const LOG_ACTION_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW_ORDERS: 'view_orders',
  VIEW_COMPLETED_ORDERS: 'view_completed_orders',
  CREATE_ORDER: 'create_order',
  UPDATE_ORDER: 'update_order',
  VIEW_MATERIALS: 'view_materials',
  USE_MATERIAL: 'use_material',
  REQUEST_REPLACEMENT: 'request_replacement'
};

// Типы пользователей
export const USER_TYPES = {
  ADMIN: 'admin',
  EXECUTER: 'executer'
};

// Типы материалов/ключей
export const MATERIAL_TYPES = {
  KEY: 'key',
  CARD: 'card',
  ACCOUNT: 'account',
  LICENSE: 'license',
  VOUCHER: 'voucher',
  OTHER: 'other'
};

// Источники материалов
export const MATERIAL_SOURCES = {
  API: 'api',
  MANUAL: 'manual',
  IMPORT: 'import'
};

// Все возможные статусы для валидации
export const ALL_STATUSES = {
  ...SERVICE_STATUS,
  ...MATERIAL_STATUS,
  ...ORDER_STATUS,
  ...PAYMENT_STATUS,
  ...EXECUTER_STATUS,
  ...REPLACEMENT_STATUS
};
