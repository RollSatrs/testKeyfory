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

// Хранение состояний ожидания ввода причины замены
const waitingForReason = {};

// Хранение состояний ожидания ввода номера заказа
const waitingForOrderNumber = {};

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

// Функция для перевода статуса материала на русский язык
const translateMaterialStatus = (status) => {
  const materialStatusTranslations = {
    'available': 'Доступен',
    'used': 'Использован',
    'reserved': 'Зарезервирован',
    'expired': 'Истёк',
    'invalid': 'Недействителен'
  };
  return materialStatusTranslations[status] || status;
};

// Функция для записи лога и обновления активности
const logActivity = async (executerId, action, description, orderId = null, serviceId = null) => {
  try {
    // Записываем лог
    const logResponse = await fetch(`${API_URL}/api/executer/log`, {
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
    const activityResponse = await fetch(`${API_URL}/api/executer/activity`, {
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
    console.log('🔄 Попытка авторизации для Telegram ID:', telegramId);
    console.log('🌐 API URL:', `${API_URL}/api/executer/auth`); // ИСПРАВЛЕНО: добавлен /api

    const response = await fetch(`${API_URL}/api/executer/auth`, { // ИСПРАВЛЕНО: добавлен /api
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegram_id: telegramId
      })
    });

    console.log('📡 Статус ответа:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Ошибка ответа:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Исполнитель авторизован:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка при авторизации:', error.message);
    console.error('❌ Полная ошибка:', error);
    return null;
  }
};

// Главное меню
const getMainMenu = () => {
  return Markup.keyboard([
    ['🎯 Мои услуги', '📋 Мои заказы'],
    ['⏳ Текущие заказы', '✅ Выполненные заказы'],
    ['📊 Статистика', '💰 Баланс'],
    ['🔧 Начать работу']
  ]).resize();
};

// Команда /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username || 'Неизвестно';

  console.log(`\n🚀 === НАЧАЛО АВТОРИЗАЦИИ ===`);
  console.log(`👤 Пользователь: ${userName}`);
  console.log(`🆔 Telegram ID: ${telegramId}`);
  console.log(`💬 Chat ID: ${chatId}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`=================================\n`);

  // Авторизация исполнителя
  const executerData = await authorizeExecuter(telegramId);

  console.log('\n📝 Результат авторизации:', executerData ? 'УСПЕХ' : 'НЕУДАЧА');

  if (!executerData) {
    console.log('❌ Отправляем сообщение об отказе в доступе');
    return ctx.reply(
      `❌ Доступ запрещен. Вы не зарегистрированы как исполнитель.\n\n` +
      `👤 Ваше имя: ${userName}\n` +
      `🆔 Ваш Telegram ID: ${telegramId}\n\n` +
      `Обратитесь к администратору для регистрации с указанием вашего Telegram ID.`
    );
  }

  console.log('✅ Создаем сессию пользователя');
  userSessions[chatId] = {
    executer_id: executerData.id,
    telegram_id: telegramId,
    name: executerData.name
  };

  // Логируем вход и обновляем активность
  await logActivity(executerData.id, 'login', `Исполнитель ${executerData.name} вошел в систему`);

  console.log('✅ Отправляем приветственное сообщение');
  return ctx.reply(
    `👋 Добро пожаловать, ${executerData.name}!\n\n` +
    `Выберите действие из меню:`,
    getMainMenu()
  );
});

// Команда для получения своего Telegram ID
bot.command('id', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username || 'Неизвестно';
  const chatId = ctx.chat.id;

  return ctx.reply(
    `👤 Ваша информация:\n\n` +
    `🆔 Telegram ID: ${telegramId}\n` +
    `📱 Chat ID: ${chatId}\n` +
    `👤 Имя: ${userName}\n\n` +
    `Эта информация может потребоваться для регистрации в системе.`
  );
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const telegramId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username || 'Неизвестно';

  // Проверка авторизации
  if (!userSessions[chatId]) {
    return ctx.reply(
      `❌ Сначала нажмите /start для авторизации\n\n` +
      `👤 Ваше имя: ${userName}\n` +
      `🆔 Ваш Telegram ID: ${telegramId}\n\n` +
      `Если вы не зарегистрированы, обратитесь к администратору.`
    );
  }

  const session = userSessions[chatId];

  // Проверяем, ожидается ли ввод причины замены
  if (waitingForReason[chatId]) {
    const { orderId, materialId } = waitingForReason[chatId];
    await processReplacementReason(ctx, orderId, materialId, text, session.executer_id);
    delete waitingForReason[chatId];
    return;
  }

  // Проверяем, ожидается ли ввод номера заказа
  if (waitingForOrderNumber[chatId]) {
    const { serviceId, serviceName } = waitingForOrderNumber[chatId];
    await processOrderNumberForService(ctx, text, session.executer_id, serviceId, serviceName);
    delete waitingForOrderNumber[chatId];
    return;
  }

  switch (text) {
    case '🔙 Назад в меню':
      ctx.reply('🏠 Главное меню', { reply_markup: getMainMenu() });
      break;

    case '🎯 Мои услуги':
      await showMyServices(ctx, session.executer_id);
      break;

    case '📋 Мои заказы':
      await showMyOrders(ctx, session.executer_id);
      break;

    case '⏳ Текущие заказы':
      await showActiveOrders(ctx, session.executer_id);
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
      // Проверяем, выбрал ли пользователь услугу
      if (text.startsWith('🎯 ')) {
        const serviceName = text.replace('🎯 ', '');
        await selectService(ctx, session.executer_id, serviceName);
        break;
      }

      // Проверяем, не ввел ли пользователь номер заказа
      if (/^\d+$/.test(text)) {
        await processOrderNumber(ctx, text, session.executer_id);
      } else {
        ctx.reply('❓ Неизвестная команда. Воспользуйтесь меню.', { reply_markup: getMainMenu() });
      }
      break;
  }
});

// Показать мои услуги
const showMyServices = async (ctx, executerId) => {
  try {
    console.log(`\n🎯 === ЗАПРОС УСЛУГ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    const response = await fetch(`${API_URL}/api/executers/services/${executerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Ответ API: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ошибка API: ${errorText}`);
      return ctx.reply('❌ Ошибка при получении списка услуг');
    }

    const services = await response.json();
    console.log(`📋 Найдено услуг: ${services.length}`);

    if (!services || services.length === 0) {
      return ctx.reply(
        '📋 *Мои услуги*\n\n' +
        '❌ У вас пока нет доступных услуг.\n' +
        'Обратитесь к администратору для получения доступа к услугам.',
        { parse_mode: 'Markdown', reply_markup: getMainMenu() }
      );
    }

    // Создаем кнопки для каждой услуги
    const serviceButtons = services.map(service => [
      `🎯 ${service.name}`
    ]);

    // Добавляем кнопку "Назад"
    serviceButtons.push(['🔙 Назад в меню']);

    const keyboard = Markup.keyboard(serviceButtons).resize();

    let message = '🎯 *Мои услуги*\n\n';
    message += 'Выберите услугу для работы:\n\n';

    services.forEach((service, index) => {
      message += `${index + 1}. *${service.name}*\n`;
      message += `   💰 Цена: ${service.price}₽\n`;
      message += `   📂 Категория: ${service.category}\n\n`;
    });

    message += '👆 Выберите услугу из списка ниже';

    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('❌ Ошибка при получении услуг:', error);
    ctx.reply('❌ Произошла ошибка при получении списка услуг');
  }
};

// Показать мои заказы
const showMyOrders = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_orders', 'Просмотр списка заказов');

    const response = await fetch(`${API_URL}/api/executer/orders/${executerId}`);

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

// Показать текущие заказы (не завершенные)
const showActiveOrders = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_active_orders', 'Просмотр текущих заказов');

    const response = await fetch(`${API_URL}/api/executer/active-orders/${executerId}`);

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении текущих заказов');
    }

    const orders = await response.json();

    if (orders.length === 0) {
      return ctx.reply('⏳ У вас пока нет текущих заказов');
    }

    let message = '⏳ Ваши текущие заказы:\n\n';
    orders.forEach(order => {
      message += `🔸 Заказ #${order.id}\n`;
      message += `📝 Услуга: ${order.Service?.name || 'Не указана'}\n`;
      message += `📅 Статус: ${translateStatus(order.status)}\n`;
      message += `💰 Сумма: ${order.total_sum} руб.\n`;
      message += `📆 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
      message += `➡️ Для работы введите: ${order.id}\n\n`;
    });

    return ctx.reply(message);
  } catch (error) {
    return ctx.reply('❌ Ошибка при получении текущих заказов');
  }
};

// Показать выполненные заказы
const showCompletedOrders = async (ctx, executerId) => {
  try {
    // Логируем действие и обновляем активность
    await logActivity(executerId, 'view_completed_orders', 'Просмотр выполненных заказов');

    const response = await fetch(`${API_URL}/api/executer/completed-orders/${executerId}`);

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

    const response = await fetch(`${API_URL}/api/executer/stats/${executerId}`);

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

    const response = await fetch(`${API_URL}/api/executer/balance/${executerId}`);

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

// Выбор услуги для работы
const selectService = async (ctx, executerId, serviceName) => {
  try {
    console.log(`\n🎯 === ВЫБОР УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`🎯 Услуга: ${serviceName}`);

    // Получаем список услуг исполнителя
    const response = await fetch(`${API_URL}/api/executers/services/${executerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении списка услуг');
    }

    const services = await response.json();
    const selectedService = services.find(service => service.name === serviceName);

    if (!selectedService) {
      return ctx.reply('❌ Услуга не найдена');
    }

    // Сохраняем состояние ожидания номера заказа
    waitingForOrderNumber[ctx.chat.id] = {
      serviceId: selectedService.id,
      serviceName: selectedService.name
    };

    ctx.reply(
      `🎯 *Услуга: ${selectedService.name}*\n\n` +
      `💰 Цена: ${selectedService.price}₽\n` +
      `📂 Категория: ${selectedService.category}\n\n` +
      `📝 *Введите номер заказа:*\n` +
      `Пожалуйста, введите номер заказа для начала работы с этой услугой.`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.keyboard([['🔙 Назад в меню']]).resize()
      }
    );

  } catch (error) {
    console.error('❌ Ошибка при выборе услуги:', error);
    ctx.reply('❌ Произошла ошибка при выборе услуги');
  }
};

// Обработка номера заказа для выбранной услуги
const processOrderNumberForService = async (ctx, orderNumber, executerId, serviceId, serviceName) => {
  try {
    console.log(`\n📝 === СОЗДАНИЕ ВЫПОЛНЕНИЯ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`🎯 Service ID: ${serviceId}`);
    console.log(`📋 Номер заказа: ${orderNumber}`);

    // Проверяем, что номер заказа является числом
    if (!/^\d+$/.test(orderNumber)) {
      return ctx.reply(
        '❌ Номер заказа должен содержать только цифры.\n\n' +
        '📝 Введите корректный номер заказа:'
      );
    }

    // Создаем выполнение услуги через новый API
    const response = await fetch(`${API_URL}/api/executers/service-execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        executer_id: executerId,
        order_number: orderNumber
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Ошибка API: ${result.message}`);
      return ctx.reply(
        `❌ Ошибка при создании заказа:\n${result.message}\n\n` +
        '📝 Попробуйте ввести другой номер заказа:'
      );
    }

    console.log(`✅ Заказ создан успешно: ID ${result.id}`);

    // Очищаем состояние ожидания
    delete waitingForOrderNumber[ctx.chat.id];

    ctx.reply(
      `✅ *Заказ успешно создан!*\n\n` +
      `🎯 Услуга: *${serviceName}*\n` +
      `📋 Номер заказа: *${orderNumber}*\n` +
      `📊 Статус: *В работе*\n\n` +
      `🎉 Теперь вы можете приступить к выполнению заказа!\n` +
      `Используйте меню для управления заказами.`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );

  } catch (error) {
    console.error('❌ Ошибка при создании заказа:', error);

    // Очищаем состояние ожидания при ошибке
    delete waitingForOrderNumber[ctx.chat.id];

    ctx.reply(
      '❌ Произошла ошибка при создании заказа.\n\n' +
      'Попробуйте еще раз или обратитесь к администратору.',
      { reply_markup: getMainMenu() }
    );
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
    // Сначала пытаемся найти существующий заказ
    const response = await fetch(`${API_URL}/api/executer/order/${orderNumber}/${executerId}`);

    if (response.ok) {
      const order = await response.json();

      if (order) {
        // Проверяем, не завершён ли уже заказ
        if (order.status === 'completed') {
          return ctx.reply('✅ Этот заказ уже выполнен! Вы не можете работать с ним повторно.');
        }

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🚀 Начать работу', `start_work_${orderNumber}`)],
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
        return;
      }
    }

    // Если заказ не найден, создаём новый заказ с этим номером
    const createResponse = await fetch(`${API_URL}/api/executer/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_number: orderNumber,
        executer_id: executerId
      })
    });

    if (!createResponse.ok) {
      return ctx.reply('❌ Ошибка при создании заказа. Попробуйте ещё раз.');
    }

    const newOrder = await createResponse.json();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Начать работу', `start_work_${orderNumber}`)],
      [Markup.button.callback('📦 Получить материалы', `get_materials_${orderNumber}`)],
      [Markup.button.callback('✅ Завершить заказ', `complete_order_${orderNumber}`)],
      [Markup.button.callback('🔄 Запросить замену', `request_replacement_${orderNumber}`)]
    ]);

    const message = `✅ Создан новый заказ #${orderNumber}\n\n` +
      `📅 Статус: ${translateStatus(newOrder.status)}\n\n` +
      `Выберите действие:`;

    await ctx.reply(message, keyboard);
    await logActivity(executerId, 'create_order', `Создан заказ #${orderNumber}`, orderNumber);

  } catch (error) {
    console.error('Ошибка при обработке номера заказа:', error);
    return ctx.reply('❌ Ошибка при обработке заказа');
  }
};

// Обработка inline кнопок
bot.action(/start_work_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await startOrderWork(ctx, orderId, session.executer_id);
});

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
  // Запускаем процесс выбора материала для замены
  await replaceMaterial(ctx, orderId, session.executer_id);
});

bot.action(/select_material_(\d+)_(.+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const materialId = ctx.match[2];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await requestSpecificMaterialReplacement(ctx, orderId, materialId, session.executer_id);
});

// Получить материалы
const getMaterials = async (ctx, orderId, executerId) => {
  try {
    console.log(`🔍 Запрос материалов для заказа ${orderId}, исполнитель ${executerId}`);
    console.log(`🌐 URL запроса: ${API_URL}/api/executer/order/${orderId}/${executerId}`);

    // Получаем данные заказа вместо прямого запроса материалов
    const response = await fetch(`${API_URL}/api/executer/order/${orderId}/${executerId}`);

    console.log(`📡 Статус ответа: ${response.status}`);

    if (!response.ok) {
      console.log(`❌ Ошибка ответа: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`❌ Текст ошибки: ${errorText}`);
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при получении заказа');
    }

    const order = await response.json();
    console.log(`� Получены данные заказа:`, JSON.stringify(order, null, 2));

    // Извлекаем материалы из поля details заказа
    let materials = [];
    if (order.details && order.details.materials) {
      materials = order.details.materials;
      console.log(`📦 Материалы из details.materials:`, JSON.stringify(materials, null, 2));
    } else if (order.details && Array.isArray(order.details)) {
      // Если details - это массив материалов
      materials = order.details;
      console.log(`📦 Материалы как массив:`, JSON.stringify(materials, null, 2));
    } else {
      console.log(`📦 Поле details пустое или не содержит материалов:`, order.details);
    }

    if (!materials || materials.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('📦 Материалы для этого заказа не найдены в details');
    }

    let message = '📦 Материалы для заказа:\n\n';

    let availableCount = 0;
    let usedCount = 0;

    materials.forEach((material, index) => {
      const status = material.status || 'available';
      if (status === 'available') availableCount++;
      if (status === 'used') usedCount++;

      message += `🔸 Материал ${index + 1}:\n`;
      message += `📝 Тип: ${material.type_key || 'Не указан'}\n`;
      message += `📋 Содержимое: ${material.contents || 'Нет данных'}\n`;
      message += `📊 Статус: ${translateMaterialStatus(status)}\n`;
      message += `📌 Источник: ${material.source || 'Не указан'}\n\n`;
    });

    // Добавляем статистику
    message = `📊 Статистика материалов:\n✅ Доступно: ${availableCount} | ❌ Использовано: ${usedCount}\n\n` + message;

    await ctx.answerCbQuery();
    await ctx.reply(message);

    await logActivity(executerId, 'get_materials', `Получение материалов для заказа #${orderId} из details`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при получении материалов');
  }
};

// Начать работу по заказу (изменить статус на "в работе")
const startOrderWork = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/api/executer/start-order`, {
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
      return ctx.reply('❌ Ошибка при начале работы над заказом');
    }

    await ctx.answerCbQuery();
    await ctx.reply('🚀 Работа над заказом начата! Статус изменен на "В работе".');

    await logActivity(executerId, 'start_order', `Начало работы над заказом #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при начале работы над заказом');
  }
};

// Завершить заказ
const completeOrder = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/api/executer/complete-order`, {
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

// Заменить материал (с выбором конкретного материала)
const replaceMaterial = async (ctx, orderId, executerId) => {
  try {
    // Сначала получаем материалы для заказа
    const response = await fetch(`${API_URL}/api/executer/order/${orderId}/${executerId}`);

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при получении информации о заказе');
    }

    const order = await response.json();
    let allMaterials = [];

    if (order.details && order.details.materials) {
      allMaterials = order.details.materials;
    }

    if (!allMaterials || allMaterials.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('📦 Материалы для замены не найдены');
    }

    // Фильтруем только доступные (неиспользованные) материалы
    const availableMaterials = allMaterials.filter(material =>
      material.status === 'available' || !material.status
    );

    if (availableMaterials.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('📦 Нет доступных материалов для замены. Все материалы уже использованы.');
    }

    // Создаем inline клавиатуру с выбором материала
    const keyboard = Markup.inlineKeyboard(
      availableMaterials.map((material, index) => [
        Markup.button.callback(
          `${material.type_key || 'Материал'} - ${material.contents?.substring(0, 20) || 'Нет данных'}...`,
          `select_material_${orderId}_${material.id || index}`
        )
      ])
    );

    await ctx.answerCbQuery();

    let statusInfo = `📊 Статистика материалов:\n`;
    statusInfo += `✅ Доступно: ${availableMaterials.length}\n`;
    statusInfo += `❌ Использовано: ${allMaterials.length - availableMaterials.length}\n\n`;

    await ctx.reply(
      statusInfo +
      '🔄 Выберите доступный материал для замены:\n\n' +
      availableMaterials.map((material, index) =>
        `${index + 1}. ${material.type_key || 'Материал'}: ${material.contents || 'Нет данных'} (${translateMaterialStatus(material.status || 'available')})`
      ).join('\n'),
      keyboard
    );

    await logActivity(executerId, 'view_materials_for_replacement', `Просмотр материалов для замены в заказе #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при получении материалов для замены');
  }
};

// Запросить замену материала
const requestReplacement = async (ctx, orderId, executerId) => {
  try {
    const response = await fetch(`${API_URL}/api/executer/request-replacement`, {
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
  }
};

// Запросить замену конкретного материала
const requestSpecificMaterialReplacement = async (ctx, orderId, materialId, executerId) => {
  try {
    const chatId = ctx.chat.id;

    // Сохраняем состояние ожидания ввода причины
    waitingForReason[chatId] = {
      orderId: orderId,
      materialId: materialId
    };

    await ctx.answerCbQuery();
    await ctx.reply('📝 Укажите причину замены материала:\n\nНапример: "Материал поврежден", "Неподходящий ключ", "Истек срок действия" и т.д.');

    await logActivity(executerId, 'request_replacement_start', `Начало запроса замены материала ID: ${materialId} для заказа #${orderId}`, orderId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при запросе замены');
  }
};

// Обработка введенной причины замены
const processReplacementReason = async (ctx, orderId, materialId, reason, executerId) => {
  try {
    const response = await fetch(`${API_URL}/api/executer/request-replacement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        executer_id: executerId,
        material_id: materialId,
        reason: reason
      })
    });

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при отправке запроса на замену');
    }

    await ctx.reply(`✅ Запрос на замену материала отправлен!\n\n📝 Причина: ${reason}\n\n⏳ Ожидайте решения администратора.`);

    await logActivity(executerId, 'request_specific_replacement', `Запрос замены материала ID: ${materialId} для заказа #${orderId}. Причина: ${reason}`, orderId);
  } catch (error) {
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

// Функция для уведомления о замене материала
const notifyMaterialReplacement = async (data) => {
  try {
    const { telegramId, orderId, serviceName, oldMaterial, newMaterial, adminComment } = data;

    let message = `🔄 Материал заменен!\n\n`;
    message += `📦 Заказ: #${orderId}\n`;
    message += `🔧 Услуга: ${serviceName}\n\n`;

    if (oldMaterial && oldMaterial !== 'Не указан') {
      message += `❌ Старый материал: ${oldMaterial}\n`;
    }

    message += `✅ Новый материал: ${newMaterial}\n\n`;

    if (adminComment) {
      message += `💬 Комментарий администратора: ${adminComment}\n\n`;
    }

    message += `Теперь вы можете использовать новый материал для выполнения заказа.`;

    await sendNotificationToExecuter(telegramId, message);
    console.log(`✅ Уведомление о замене материала отправлено исполнителю ${telegramId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления о замене:', error.message);
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

// Экспорт функций для использования в других модулях
export { notifyMaterialReplacement };
