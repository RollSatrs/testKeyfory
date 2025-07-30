// Локализация статусов и типов для Telegram бота

// Статусы материалов для бота
export const MATERIAL_STATUS_BOT = {
  'available': '✅ Доступен',
  'used': '❌ Использован',
  'pending_replace': '🔄 На замене',
  'in_use': '🔄 Используется'
};

// Статусы заказов для бота
export const ORDER_STATUS_BOT = {
  'pending': '⏳ Ожидает',
  'in_progress': '🔄 В работе',
  'completed': '✅ Завершен',
  'cancelled': '❌ Отменен',
  'awaiting_payment': '💰 Ожидает оплаты'
};

// Статусы исполнителей для бота
export const EXECUTER_STATUS_BOT = {
  'active': '✅ Активен',
  'inactive': '⏸️ Неактивен',
  'busy': '🔄 Занят',
  'blocked': '❌ Заблокирован'
};

// Типы материалов для бота
export const MATERIAL_TYPE_BOT = {
  'key': '🔑 Ключ',
  'card': '💳 Карта',
  'account': '👤 Аккаунт',
  'license': '📄 Лицензия',
  'voucher': '🎫 Ваучер',
  'other': '📦 Другое'
};

// Функции для получения локализованных значений в боте
export const getBotStatusLabel = (status, type = 'material') => {
  const maps = {
    material: MATERIAL_STATUS_BOT,
    order: ORDER_STATUS_BOT,
    executer: EXECUTER_STATUS_BOT
  };

  return maps[type]?.[status] || status;
};

export const getBotTypeLabel = (type) => {
  return MATERIAL_TYPE_BOT[type] || `📦 ${type}`;
};

// Сообщения для различных действий
export const BOT_MESSAGES = {
  MATERIAL_USED_SUCCESS: '✅ *Материал успешно использован!*\n\n📅 Дата использования: {date}\n\nМатериал скопирован и отмечен как использованный.',
  MATERIAL_NOT_AVAILABLE: '❌ Материал недоступен или уже использован',
  ORDER_NOT_FOUND: '❌ Заказ не найден',
  SERVICE_NOT_AVAILABLE: '❌ Услуга недоступна или неактивна',
  EXECUTER_BLOCKED: '🚫 Ваш аккаунт заблокирован',
  NO_MATERIALS: '📦 Нет доступных материалов для данной услуги',
  ORDER_ASSIGNED: '✅ Заказ успешно привязан!\n\n📋 Номер заказа: {orderNumber}\n🎯 Услуга: {serviceName}\n📦 Материал получен',
  ORDER_COMPLETED: '✅ *Заказ выполнен!*\n\n📋 Номер заказа: {orderNumber}\n🎯 Услуга: {serviceName}\n💰 Сумма: {price} ₽\n\n⏳ Ожидается подтверждение оплаты администратором.',
  SERVICE_INFO: '🎯 *{serviceName}*\n\n💰 Стоимость: {price} ₽\n📋 Номер заказа: {orderNumber}\n\n📦 Выберите материал для работы:',
  MATERIAL_IN_USE: '🔄 *Материал используется*\n\n📦 Содержимое: `{content}`\n\nВыберите действие:'
};
