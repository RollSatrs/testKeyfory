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
  REQUEST_REPLACEMENT: 'request_replacement',

  // Новые типы действий для бота
  BOT_START: 'bot_start',
  BOT_MENU_MAIN: 'bot_menu_main',
  BOT_MENU_ORDERS: 'bot_menu_orders',
  BOT_MENU_MATERIALS: 'bot_menu_materials',
  BOT_MENU_PROFILE: 'bot_menu_profile',
  BOT_VIEW_ORDER_DETAILS: 'bot_view_order_details',
  BOT_ACCEPT_ORDER: 'bot_accept_order',
  BOT_COMPLETE_ORDER: 'bot_complete_order',
  BOT_CANCEL_ORDER: 'bot_cancel_order',
  BOT_VIEW_MATERIAL_DETAILS: 'bot_view_material_details',
  BOT_USE_MATERIAL: 'bot_use_material',
  BOT_REQUEST_MATERIAL_REPLACEMENT: 'bot_request_material_replacement',
  BOT_UPDATE_PROFILE: 'bot_update_profile',
  BOT_BUTTON_CLICK: 'bot_button_click',
  BOT_NAVIGATION: 'bot_navigation',
  BOT_ERROR: 'bot_error'
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
