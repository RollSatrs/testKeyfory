import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' });

// Токен бота и адрес API
const BOT_TOKEN = process.env.EXECUTER_BOT_TOKEN;
const API_URL = process.env.API_URL;

// Проверяем наличие токена
if (!BOT_TOKEN) {
  console.error('❌ Не найден токен бота! Установите BOT_TOKEN в переменных окружения');
  process.exit(1);
}

console.log('🔑 Используется токен:', BOT_TOKEN.substring(0, 10) + '...');

// Создание бота
const bot = new Telegraf(BOT_TOKEN);

// Хранение сессий пользователей (временно в памяти)
const userSessions = {};

// Функция для перевода статуса на русский язык
const translateStatus = (status) => {
  const statusTranslations = {
    'pending': 'Ожидает',
    'in_progress': 'В работе',
    'completed': 'Выполнен',
    'cancelled': 'Отменён',
    'on_hold': 'Приостановлен'
  };
  return statusTranslations[status] || status;
};

// Функция для записи лога и обновления активности
const logActivity = async (executerId, action, description, orderId = null, serviceId = null) => {
  try {
    // Записываем лог
    const logResponse = await fetch(`${API_URL}/executer/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: executerId,
        user_type: 'executer',
        action,
        description,
        order_id: orderId,
        service_id: serviceId
      })
    });

    // Обновляем активность исполнителя
    const activityResponse = await fetch(`${API_URL}/executer/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        executer_id: executerId
      })
    });
  } catch (error) {
    console.error('Ошибка записи лога или обновления активности:', error.message);
  }
};

// Функция авторизации исполнителя
const authorizeExecuter = async (telegramId) => {
  try {
    const response = await fetch(`${API_URL}/executer/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegram_id: telegramId
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log('✅ Исполнитель авторизован:', data.name);
    return data;
  } catch (error) {
    return null;
  }
};

// Главное меню
const getMainMenu = () => {
  return Markup.keyboard([
    ['📋 Мои заказы', '✅ Выполненные заказы'],
    ['📊 Статистика', '💰 Баланс'],
    ['🔧 Начать работу']
  ]).resize();
};

// Команда /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();
  console.log(`✅ Начало работы исполнителя ${telegramId}`);

  // Авторизация исполнителя
  const executerData = await authorizeExecuter(telegramId);

  if (!executerData) {
    return ctx.reply('❌ Доступ запрещен. Вы не зарегистрированы как исполнитель.');
  }

  userSessions[chatId] = {
    executer_id: executerData.id,
    telegram_id: telegramId,
    name: executerData.name
  };

  // Логируем вход и обновляем активность
  await logActivity(executerData.id, 'login', `Исполнитель ${executerData.name} вошел в систему`);

  return ctx.reply(
    `👋 Добро пожаловать, ${executerData.name}!\n\n` +
    `Выберите действие из меню:`,
    getMainMenu()
  );
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;

  // Проверка авторизации
  if (!userSessions[chatId]) {
    return ctx.reply('❌ Сначала нажмите /start для авторизации');
  }

  const session = userSessions[chatId];

  switch (text) {
    case '📋 Мои заказы':
      await showMyOrders(ctx, session.executer_id);
      break;

    case '✅ Выполненные заказы':
      await showCompletedOrders(ctx, session.executer_id);
      break;

    case '📊 Статистика':
      await showStatistics(ctx, session.executer_id);
      break;

    case '💰 Баланс':
      await showBalance(ctx, session.executer_id);
      break;

    case '🔧 Начать работу':
      await startWork(ctx, session.executer_id);
      break;

    default:
      // Проверяем, не ввел ли пользователь номер заказа
      if (/^\d+$/.test(text)) {
        await processOrderNumber(ctx, text, session.executer_id);
      }
      break;
  }
});

// Показать мои заказы
const showMyOrders = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_orders', 'Просмотр списка заказов');

    const response = await fetch(`${API_URL}/executer/orders/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении заказов');
    }

    const orders = await response.json();

    if (orders.length === 0) {
      return ctx.reply('📋 У вас пока нет заказов');
    }

    let message = '📋 Ваши заказы:\n\n';
    orders.forEach(order => {
      message += `🔸 Заказ #${order.id}\n`;
      message += `📝 Услуга: ${order.Service?.name || 'Не указана'}\n`;
      message += `📅 Статус: ${translateStatus(order.status)}\n`;
      message += `💰 Сумма: ${order.total_sum} руб.\n`;
      message += `📆 Дата: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
    });

    return ctx.reply(message);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении заказов');
  }
};

// Показать выполненные заказы
const showCompletedOrders = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_completed_orders', 'Просмотр выполненных заказов');

    const response = await fetch(`${API_URL}/executer/completed-orders/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении выполненных заказов');
    }

    const orders = await response.json();

    if (orders.length === 0) {
      return ctx.reply('✅ У вас пока нет выполненных заказов');
    }

    let message = '✅ Ваши выполненные заказы:\n\n';
    orders.forEach(order => {
      message += `🔸 Заказ #${order.id}\n`;
      message += `📝 Услуга: ${order.Service?.name || 'Не указана'}\n`;
      message += `📅 Статус: ${translateStatus(order.status)}\n`;
      message += `💰 Сумма: ${order.total_sum} руб.\n`;
      message += `📆 Выполнен: ${new Date(order.updated_at).toLocaleDateString()}\n\n`;
    });

    return ctx.reply(message);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении выполненных заказов');
  }
};

// Показать статистику
const showStatistics = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_statistics', 'Просмотр статистики');

    const response = await fetch(`${API_URL}/executer/stats/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении статистики');
    }

    const stats = await response.json();

    const message = `📊 Ваша статистика:\n\n` +
      `✅ Выполнено заказов: ${stats.completedOrders}\n` +
      `⏳ В работе: ${stats.activeOrders}\n` +
      `💰 Общий заработок: ${stats.totalEarnings} руб.\n` +
      `⭐ Рейтинг: ${stats.rating}/5\n` +
      `🔄 Запросов на замену: ${stats.replacementRequests}`;

    return ctx.reply(message);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении статистики');
  }
};

// Показать баланс
const showBalance = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_balance', 'Просмотр баланса');

    const response = await fetch(`${API_URL}/executer/balance/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении баланса');
    }

    const data = await response.json();
    const balance = data.balance;

    return ctx.reply(`💰 Ваш баланс: ${balance} руб.`);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении баланса');
  }
};

// Начать работу (ввод номера заказа)
const startWork = async (ctx, executerId) => {
  return ctx.reply(
    '🔧 Введите номер заказа для начала работы:\n\n' +
    'Например: 123'
  );
};

// Обработка номера заказа
const processOrderNumber = async (ctx, orderNumber, executerId) => {
  try {
    const response = await fetch(`${API_URL}/executer/order/${orderNumber}/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Заказ не найден или недоступен для вас');
    }

    const order = await response.json();

    if (!order) {
      return ctx.reply('❌ Заказ не найден или недоступен для вас');
    }

    // Проверяем, не завершён ли уже заказ
    if (order.status === 'completed') {
      return ctx.reply('✅ Этот заказ уже выполнен! Вы не можете работать с ним повторно.');
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Получить материалы', `get_materials_${orderNumber}`)],
      [Markup.button.callback('✅ Завершить заказ', `complete_order_${orderNumber}`)],
      [Markup.button.callback('🔄 Запросить замену', `request_replacement_${orderNumber}`)]
    ]);

    const message = `📋 Заказ #${orderNumber}\n\n` +
      `📝 Услуга: ${order.Service?.name}\n` +
      `💰 Сумма: ${order.total_sum} руб.\n` +
      `📅 Статус: ${translateStatus(order.status)}\n\n` +
      `Выберите действие:`;

    await ctx.reply(message, keyboard);

    await logActivity(executerId, 'view_order', `Просмотр заказа #${orderNumber}`, orderNumber);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении информации о заказе');
  }
};

// Обработка inline кнопок
bot.action(/get_materials_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await getMaterials(ctx, orderId, session.executer_id);
});

bot.action(/complete_order_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await completeOrder(ctx, orderId, session.executer_id);
});

bot.action(/request_replacement_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await requestReplacement(ctx, orderId, session.executer_id);
});

// Получить материалы
const getMaterials = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/executer/materials/${orderId}`);

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при получении материалов');
    }

    const materials = await response.json();

    if (materials.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('📦 Материалы для этого заказа не найдены');
    }

    let message = '📦 Материалы для заказа:\n\n';
    materials.forEach(material => {
      message += `🔸 ${material.material_name}\n`;
      message += `📋 Данные: ${material.material_data}\n`;
      message += `📊 Количество: ${material.quantity}\n\n`;
    });

    await ctx.answerCbQuery();
    await ctx.reply(message);

    await logActivity(executerId, 'get_materials', `Получение материалов для заказа #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при получении материалов');
  }
};

// Завершить заказ
const completeOrder = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/executer/complete-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        executer_id: executerId
      })
    });

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при завершении заказа');
    }

    await ctx.answerCbQuery();
    await ctx.reply('✅ Заказ успешно завершен! Баланс обновлен.');

    await logActivity(executerId, 'complete_order', `Завершение заказа #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при завершении заказа');
  }
};

// Запросить замену материала
const requestReplacement = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/executer/request-replacement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        executer_id: executerId,
        reason: 'Запрос замены материала'
      })
    });

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при отправке запроса на замену');
    }

    await ctx.answerCbQuery();
    await ctx.reply('🔄 Запрос на замену материала отправлен. Ожидайте решения администратора.');

    await logActivity(executerId, 'request_replacement', `Запрос замены материала для заказа #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при отправке запроса на замену');
  }
};

// Функция для отправки уведомлений исполнителю
const sendNotificationToExecuter = async (telegramId, message) => {
  try {
    // Находим chatId по telegram_id
    const chatId = Object.keys(userSessions).find(key =>
      userSessions[key].telegram_id === telegramId
    );

    if (chatId) {
      await bot.telegram.sendMessage(chatId, `🔔 ${message}`);
    } else {
      // Если сессии нет, отправляем напрямую по telegram_id
      await bot.telegram.sendMessage(telegramId, `🔔 ${message}`);
    }
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error.message);
  }
};

// Запуск бота с обработкой ошибок
bot.launch()
  .then(() => {
    console.log('🤖 Telegram-бот для исполнителей запущен (Telegraf)');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error.message);
    if (error.message.includes('401')) {
      console.error('💡 Проверьте правильность токена бота в .env файле');
      console.error('💡 Получите новый токен у @BotFather в Telegram');
    }
    process.exit(1);
  });

// Обработка graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Экспорт функции для отправки уведомлений
export { sendNotificationToExecuter };
