// Локализация статусов и типов для отображения на русском языке
// Ключи соответствуют английским значениям из базы данных

// Статусы услуг
export const SERVICE_STATUS_LABELS = {
  'active': 'АКТИВНА',
  'inactive': 'НЕАКТИВНА'
};

// Цвета для статусов услуг
export const SERVICE_STATUS_COLORS = {
  'active': 'green',
  'inactive': 'orange'
};

// Статусы материалов
export const MATERIAL_STATUS_LABELS = {
  'available': 'Доступен',
  'used': 'Использован',
  'pending_replace': 'На замене',
  'in_use': 'Используется',
  'ИСПОЛЬЗОВАН': 'Использован' // для обратной совместимости
};

// Цвета для статусов материалов
export const MATERIAL_STATUS_COLORS = {
  'available': 'green',
  'used': 'red',
  'pending_replace': 'orange',
  'in_use': 'blue',
  'ИСПОЛЬЗОВАН': 'red' // для обратной совместимости
};

// Статусы заказов
export const ORDER_STATUS_LABELS = {
  'pending': 'ОЖИДАЕТ',
  'in_progress': 'В РАБОТЕ',
  'completed': 'ЗАВЕРШЕН',
  'cancelled': 'ОТМЕНЕН',
  'awaiting_payment': 'ОЖИДАЕТ ОПЛАТЫ'
};

// Цвета для статусов заказов
export const ORDER_STATUS_COLORS = {
  'pending': 'orange',
  'in_progress': 'blue',
  'completed': 'green',
  'cancelled': 'red',
  'awaiting_payment': 'purple'
};

// Статусы оплаты
export const PAYMENT_STATUS_LABELS = {
  'pending': 'ОЖИДАЕТ ОПЛАТЫ',
  'paid': 'ОПЛАЧЕН',
  'failed': 'ОШИБКА ОПЛАТЫ',
  'refunded': 'ВОЗВРАТ'
};

// Цвета для статусов оплаты
export const PAYMENT_STATUS_COLORS = {
  'pending': 'orange',
  'paid': 'green',
  'failed': 'red',
  'refunded': 'purple'
};

// Статусы исполнителей
export const EXECUTER_STATUS_LABELS = {
  'active': 'Активен',
  'inactive': 'Неактивен',
  'busy': 'Занят',
  'blocked': 'Заблокирован'
};

// Цвета для статусов исполнителей
export const EXECUTER_STATUS_COLORS = {
  'active': 'green',
  'inactive': 'orange',
  'busy': 'blue',
  'blocked': 'red'
};

// Статусы запросов на замену
export const REPLACEMENT_STATUS_LABELS = {
  'pending': 'Ожидает',
  'approved': 'Одобрено',
  'rejected': 'Отклонено'
};

// Цвета для статусов замены
export const REPLACEMENT_STATUS_COLORS = {
  'pending': 'orange',
  'approved': 'green',
  'rejected': 'red'
};

// Типы материалов
export const MATERIAL_TYPE_LABELS = {
  'key': 'Ключ',
  'card': 'Карта',
  'account': 'Аккаунт',
  'license': 'Лицензия',
  'voucher': 'Ваучер',
  'other': 'Другое',
  'imported': 'Импорт'
};

// Источники материалов
export const MATERIAL_SOURCE_LABELS = {
  'api': 'API склада',
  'manual': 'Ручная загрузка',
  'import': 'Импорт файла',
  'file_upload': 'Из склада'
};

// Типы действий в логах
export const LOG_ACTION_LABELS = {
  'login': 'Вход в систему',
  'logout': 'Выход из системы',
  'view_orders': 'Просмотр заказов',
  'view_completed_orders': 'Просмотр выполненных заказов',
  'create_order': 'Создание заказа',
  'update_order': 'Обновление заказа',
  'view_materials': 'Просмотр материалов',
  'use_material': 'Использование материала',
  'request_replacement': 'Запрос замены'
};

// Типы пользователей
export const USER_TYPE_LABELS = {
  'admin': 'Администратор',
  'executer': 'Исполнитель'
};

// Универсальные функции для получения локализованных значений
export const getStatusLabel = (status, type = 'general') => {
  const maps = {
    service: SERVICE_STATUS_LABELS,
    material: MATERIAL_STATUS_LABELS,
    order: ORDER_STATUS_LABELS,
    payment: PAYMENT_STATUS_LABELS,
    executer: EXECUTER_STATUS_LABELS,
    replacement: REPLACEMENT_STATUS_LABELS
  };

  return maps[type]?.[status] || status;
};

export const getStatusColor = (status, type = 'general') => {
  const maps = {
    service: SERVICE_STATUS_COLORS,
    material: MATERIAL_STATUS_COLORS,
    order: ORDER_STATUS_COLORS,
    payment: PAYMENT_STATUS_COLORS,
    executer: EXECUTER_STATUS_COLORS,
    replacement: REPLACEMENT_STATUS_COLORS
  };

  return maps[type]?.[status] || 'default';
};

export const getTypeLabel = (type, category = 'material') => {
  const maps = {
    material: MATERIAL_TYPE_LABELS,
    user: USER_TYPE_LABELS,
    source: MATERIAL_SOURCE_LABELS,
    action: LOG_ACTION_LABELS
  };

  return maps[category]?.[type] || type;
};
