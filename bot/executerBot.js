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

// Хранение состояний для отмены заказов
const waitingForCancelReason = {};

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

// Запросить отмену выполнения
const requestCancelExecution = async (ctx, executionId, executerId) => {
  try {
    const chatId = ctx.chat.id;

    // Сохраняем состояние ожидания ввода причины отмены
    waitingForCancelReason[chatId] = {
      executionId: executionId
    };

    await ctx.answerCbQuery();
    await ctx.reply('📝 Укажите причину отмены заказа:\n\nНапример: "Технические проблемы", "Неподходящий материал", "Изменились обстоятельства" и т.д.');

    await logActivity(executerId, 'request_cancel_start', `Начало запроса отмены заказа ID: ${executionId}`, null, executionId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при запросе отмены');
  }
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
    ['🎯 Мои услуги', '📋 Активные заказы'],
    ['📊 Статистика']
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
    const { materialId, executionId } = waitingForReason[chatId];
    await processReplacementReason(ctx, materialId, executionId, text, session.executer_id);
    delete waitingForReason[chatId];
    return;
  }

  // Проверяем, ожидается ли ввод причины отмены
  if (waitingForCancelReason[chatId]) {
    const { executionId } = waitingForCancelReason[chatId];
    await processCancelReason(ctx, executionId, text, session.executer_id);
    delete waitingForCancelReason[chatId];
    return;
  }

  switch (text) {
    case '🔙 Назад в меню':
      ctx.reply('🏠 Главное меню', { reply_markup: getMainMenu() });
      break;

    case '🎯 Мои услуги':
      await showMyServices(ctx, session.executer_id);
      break;

    case '📋 Активные заказы':
      await showActiveExecutions(ctx, session.executer_id);
      break;

    case '📊 Статистика':
      await showStatistics(ctx, session.executer_id);
      break;

    default:
      // Проверяем, выбрал ли пользователь услугу и ожидается номер заказа
      if (session.selectedService && /^\d+$/.test(text)) {
        await processOrderNumberForService(ctx, text, session.executer_id, session.selectedService);
        delete session.selectedService;
        break;
      }

      // Проверяем кнопочный выбор услуги (старая система)
      if (text.startsWith('🎯 ')) {
        const serviceName = text.replace('🎯 ', '');
        await selectService(ctx, session.executer_id, serviceName);
        break;
      }

      // Проверяем, ожидается ли номер заказа для использования материала
      if (session.pendingMaterial && /^\d+$/.test(text)) {
        await processOrderNumberForMaterial(ctx, text, session.executer_id, session.pendingMaterial);
        delete session.pendingMaterial;
        break;
      }

      ctx.reply('❓ Неизвестная команда. Воспользуйтесь меню.', { reply_markup: getMainMenu() });
      break;
  }
});

// Показать мои услуги
const showMyServices = async (ctx, executerId) => {
  try {
    console.log(`\n🎯 === ЗАПРОС УСЛУГ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`🌐 API URL: ${API_URL}`);
    console.log(`📡 Полный URL: ${API_URL}/api/executers/services/${executerId}`);

    const response = await fetch(`${API_URL}/api/executers/services/${executerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Ответ API: ${response.status}`);
    console.log(`📡 Headers: ${JSON.stringify(response.headers.raw())}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ошибка API: ${errorText}`);
      return ctx.reply('❌ Ошибка при получении списка услуг');
    }

    const services = await response.json();
    console.log(`📋 Найдено услуг: ${services.length}`);
    console.log(`📋 Услуги:`, services);

    if (!services || services.length === 0) {
      console.log('❌ Нет услуг для отображения');
      return ctx.reply(
        '📋 *Мои услуги*\n\n' +
        '❌ У вас пока нет доступных услуг.\n' +
        'Обратитесь к администратору для получения доступа к услугам.',
        { parse_mode: 'Markdown', reply_markup: getMainMenu() }
      );
    }

    console.log(`🔘 Создаем inline кнопки...`);
    // Создаем INLINE кнопки для каждой услуги (АЛЬТЕРНАТИВНЫЙ СПОСОБ)
    const serviceButtons = [];
    services.forEach(service => {
      const buttonText = `🎯 ${service.name}`;
      const callbackData = `select_service_${service.id}`;
      console.log(`🔘 Кнопка: "${buttonText}" -> ${callbackData}`);

      serviceButtons.push([{
        text: buttonText,
        callback_data: callbackData
      }]);
    });

    console.log(`🔘 Создано кнопок: ${serviceButtons.length}`);

    // Создаем keyboard напрямую через объект
    const keyboard = {
      reply_markup: {
        inline_keyboard: serviceButtons
      }
    };

    console.log(`🔘 Keyboard создан (новый способ):`, JSON.stringify(keyboard, null, 2));

    let message = '🎯 *Мои услуги*\n\n';
    message += 'Выберите услугу для работы:\n\n';

    services.forEach((service, index) => {
      message += `${index + 1}. *${service.name}*\n`;
      message += `   💰 Цена: ${service.price}₽\n`;
      message += `   📂 Категория: ${service.category}\n\n`;
    });

    message += '👆 Нажмите на кнопку услуги ниже';

    console.log(`📱 Отправляем сообщение в Telegram...`);
    console.log(`📱 Message:`, message);
    console.log(`📱 Keyboard:`, JSON.stringify(keyboard, null, 2));

    // Отправляем сообщение с inline кнопками
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard  // Распаковываем объект keyboard
    });

    console.log(`✅ Сообщение отправлено успешно!`);

  } catch (error) {
    console.error('❌ Ошибка при получении услуг:', error);
    console.error('❌ Stack trace:', error.stack);
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

    const response = await fetch(`${API_URL}/api/executers/stats/${executerId}`);

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

    const response = await fetch(`${API_URL}/api/executers/balance/${executerId}`);

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

    // Показываем материалы для услуги
    await showServiceMaterials(ctx, executerId, selectedService);

  } catch (error) {
    console.error('❌ Ошибка при выборе услуги:', error);
    ctx.reply('❌ Произошла ошибка при выборе услуги');
  }
};

// Показать материалы услуги с кнопками
const showServiceMaterials = async (ctx, executerId, service) => {
  try {
    console.log(`\n� === ПОЛУЧЕНИЕ МАТЕРИАЛОВ УСЛУГИ ===`);
    console.log(`🎯 Service ID: ${service.id}`);

    // Получаем доступные материалы для услуги
    const response = await fetch(`${API_URL}/api/executers/materials/${service.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении материалов');
    }

    const materials = await response.json();
    console.log(`📦 Найдено материалов: ${materials.length}`);

    // Фильтруем только доступные материалы
    const availableMaterials = materials.filter(m => m.status === 'available');

    if (availableMaterials.length === 0) {
      return ctx.reply(
        `🎯 *${service.name}*\n\n` +
        `❌ Нет доступных материалов для этой услуги.\n` +
        `Обратитесь к администратору.`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.keyboard([['🔙 Назад в меню']]).resize()
        }
      );
    }

    // Создаем inline кнопки для каждого материала
    const materialButtons = availableMaterials.slice(0, 10).map(material => [
      Markup.button.callback(
        `📦 ${material.contents.substring(0, 30)}...`,
        `use_material_${material.id}_${service.id}`
      )
    ]);

    // Добавляем кнопку "Запросить замену"
    materialButtons.push([
      Markup.button.callback('🔄 Запросить замену материала', `request_replacement_${service.id}`)
    ]);

    const keyboard = Markup.inlineKeyboard(materialButtons);

    ctx.reply(
      `🎯 *${service.name}*\n\n` +
      `� Цена: ${service.price}₽\n` +
      `� Категория: ${service.category}\n\n` +
      `📦 *Доступные материалы:* ${availableMaterials.length}\n\n` +
      `Выберите материал для использования:`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

    await logActivity(executerId, 'view_materials', `Просмотр материалов услуги "${service.name}"`, null, service.id);

  } catch (error) {
    console.error('❌ Ошибка при получении материалов:', error);
    ctx.reply('❌ Произошла ошибка при получении материалов');
  }
};

// Функция для обработки номера заказа для услуги
const processOrderNumberForService = async (ctx, orderNumber, executerId, serviceId) => {
  try {
    // Создаем запись в ServiceExecution
    const response = await fetch(`${API_URL}/api/executers/create-service-execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_number: orderNumber,
        executer_id: executerId,
        service_id: serviceId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    ctx.reply(
      `✅ Заказ №${orderNumber} успешно обработан!\n\n` +
      `📋 Детали:\n` +
      `• Услуга: ${result.serviceName}\n` +
      `• Номер заказа: ${orderNumber}\n` +
      `• Время: ${new Date().toLocaleString('ru-RU')}\n\n` +
      `🎯 Можете выбрать следующую услугу или вернуться в главное меню.`,
      { reply_markup: getMainMenu() }
    );

  } catch (error) {
    console.error('Error creating service execution:', error);
    ctx.reply(
      `❌ Ошибка при обработке заказа №${orderNumber}.\n\n` +
      `Пожалуйста, попrobуйте еще раз или обратитесь к администратору.`,
      { reply_markup: getMainMenu() }
    );
  }
};

// Обработка номера заказа для использования материала
const processOrderNumberForMaterial = async (ctx, orderNumber, executerId, pendingMaterial) => {
  try {
    const { materialId, serviceId } = pendingMaterial;

    console.log(`\n📝 === СОЗДАНИЕ ЗАКАЗА С МАТЕРИАЛОМ ===`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`🎯 Service ID: ${serviceId}`);
    console.log(`📦 Material ID: ${materialId}`);
    console.log(`📋 Номер заказа: ${orderNumber}`);

    // Проверяем, что номер заказа является числом
    if (!/^\d+$/.test(orderNumber)) {
      return ctx.reply(
        '❌ Номер заказа должен содержать только цифры.\n\n' +
        '📝 Введите корректный номер заказа:'
      );
    }

    // Создаем ServiceExecution и используем материал
    const response = await fetch(`${API_URL}/api/executers/use-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        material_id: materialId,
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

    console.log(`✅ Заказ создан и материал использован: ${result.message}`);

    ctx.reply(
      `✅ *Заказ успешно создан!*\n\n` +
      `📋 Номер заказа: *${orderNumber}*\n` +
      `🎯 Услуга: *${result.serviceName || 'Услуга'}*\n` +
      `📦 Материал: *${result.materialContent || 'Материал'}*\n` +
      `📊 Статус: *В работе*\n\n` +
      `🎉 Материал успешно использован для заказа!`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );

    await logActivity(executerId, 'use_material', `Использован материал ID:${materialId} для заказа #${orderNumber}`, null, serviceId);

  } catch (error) {
    console.error('❌ Ошибка при создании заказа с материалом:', error);

    ctx.reply(
      '❌ Произошла ошибка при создании заказа.\n\n' +
      'Попробуйте еще раз или обратитесь к администратору.',
      { reply_markup: getMainMenu() }
    );
  }
};

// Показать активные заказы (ServiceExecution)
const showActiveExecutions = async (ctx, executerId) => {
  try {
    console.log(`\n📋 === ПОЛУЧЕНИЕ АКТИВНЫХ ЗАКАЗОВ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Получаем активные выполнения услуг
    const response = await fetch(`${API_URL}/api/executers/active-executions/${executerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при получении активных заказов');
    }

    const executions = await response.json();
    console.log(`� Найдено активных заказов: ${executions.length}`);

    if (executions.length === 0) {
      return ctx.reply(
        '📋 *Активные заказы*\n\n' +
        '❌ У вас пока нет активных заказов.\n' +
        'Выберите услугу из меню "🎯 Мои услуги" для начала работы.',
        {
          parse_mode: 'Markdown',
          reply_markup: getMainMenu()
        }
      );
    }

    // Создаем кнопки для каждого активного заказа
    const executionButtons = executions.slice(0, 10).map(execution => [
      Markup.button.callback(
        `📋 ${execution.order_number} - ${execution.Service?.name || 'Услуга'}`,
        `manage_execution_${execution.id}`
      )
    ]);

    const keyboard = Markup.inlineKeyboard(executionButtons);

    let message = '📋 *Ваши активные заказы:*\n\n';

    executions.forEach((execution, index) => {
      message += `${index + 1}. 📋 Заказ *${execution.order_number}*\n`;
      message += `   🎯 Услуга: ${execution.Service?.name || 'Не указана'}\n`;
      message += `   📊 Статус: ${translateStatus(execution.status)}\n`;
      message += `   📅 Создан: ${new Date(execution.created_at).toLocaleDateString()}\n\n`;
    });

    message += '👆 Выберите заказ для управления';

    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    await logActivity(executerId, 'view_active_executions', 'Просмотр активных заказов');

  } catch (error) {
    console.error('❌ Ошибка при получении активных заказов:', error);
    ctx.reply('❌ Произошла ошибка при получении активных заказов');
  }
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
bot.action(/use_material_(\d+)_(\d+)/, async (ctx) => {
  const materialId = ctx.match[1];
  const serviceId = ctx.match[2];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await useMaterialForService(ctx, materialId, serviceId, session.executer_id);
});

bot.action(/request_replacement_(\d+)/, async (ctx) => {
  const serviceId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await showReplacementMaterials(ctx, serviceId, session.executer_id);
});

bot.action(/replace_material_(\d+)_(\d+)/, async (ctx) => {
  const materialId = ctx.match[1];
  const serviceId = ctx.match[2];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await requestMaterialReplacement(ctx, materialId, serviceId, session.executer_id);
});

bot.action(/manage_execution_(\d+)/, async (ctx) => {
  const executionId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await manageExecution(ctx, executionId, session.executer_id);
});

bot.action(/complete_execution_(\d+)/, async (ctx) => {
  const executionId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await completeExecution(ctx, executionId, session.executer_id);
});

bot.action('show_active_executions', async (ctx) => {
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await showActiveExecutions(ctx, session.executer_id);
});

bot.action(/show_replacements_(\d+)/, async (ctx) => {
  const serviceId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await showReplacementMaterials(ctx, serviceId, session.executer_id);
});

bot.action(/cancel_execution_(\d+)/, async (ctx) => {
  const executionId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  await requestCancelExecution(ctx, executionId, session.executer_id);
});

// Обработчик выбора услуги
bot.action(/select_service_(\d+)/, async (ctx) => {
  const serviceId = ctx.match[1];
  const chatId = ctx.chat.id;

  console.log(`\n🔘 === НАЖАТА INLINE КНОПКА ===`);
  console.log(`🔘 Service ID: ${serviceId}`);
  console.log(`🔘 Chat ID: ${chatId}`);
  console.log(`🔘 Callback Data: ${ctx.callbackQuery.data}`);

  if (!userSessions[chatId]) {
    console.log(`❌ Сессия не найдена для Chat ID: ${chatId}`);
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];
  console.log(`✅ Сессия найдена для исполнителя: ${session.executer_id}`);

  // Сохраняем выбранную услугу в сессии
  session.selectedService = serviceId;
  console.log(`✅ Услуга ${serviceId} сохранена в сессии`);

  await ctx.answerCbQuery();
  console.log(`✅ Callback query отвечен`);

  await ctx.reply(
    '📝 *Введите номер заказа:*\n\n' +
    'Пожалуйста, введите номер заказа для этой услуги.',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.keyboard([['🔙 Назад в меню']]).resize()
    }
  );

  console.log(`✅ Сообщение с запросом номера заказа отправлено`);
});

bot.action(/confirm_cancel_execution_(\d+)/, async (ctx) => {
  const executionId = ctx.match[1];
  const chatId = ctx.chat.id;

  if (!userSessions[chatId]) {
    return ctx.answerCbQuery('Сессия истекла. Нажмите /start');
  }

  const session = userSessions[chatId];

  // Сохраняем состояние ожидания причины отмены
  waitingForCancelReason[chatId] = { executionId };

  await ctx.answerCbQuery();
  await ctx.reply('📝 Укажите причину отмены заказа:\n\nНапример: "Ошибка в заказе", "Нет материалов", "Технические проблемы" и т.д.');
});

// Использовать материал для услуги
const useMaterialForService = async (ctx, materialId, serviceId, executerId) => {
  try {
    console.log(`\n� === ИСПОЛЬЗОВАНИЕ МАТЕРИАЛА ===`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`📦 Material ID: ${materialId}`);
    console.log(`🎯 Service ID: ${serviceId}`);

    // Запрашиваем номер заказа у пользователя
    ctx.answerCbQuery();

    // Сохраняем данные в сессии для дальнейшего использования
    const session = userSessions[ctx.chat.id];
    session.pendingMaterial = {
      materialId,
      serviceId
    };

    await ctx.reply(
      '� *Введите номер заказа:*\n\n' +
      'Пожалуйста, введите номер заказа для использования этого материала.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.keyboard([['🔙 Назад в меню']]).resize()
      }
    );

  } catch (error) {
    console.error('❌ Ошибка при подготовке использования материала:', error);
    ctx.answerCbQuery();
    ctx.reply('❌ Произошла ошибка при подготовке использования материала');
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

// Обработка введенной причины отмены
const processCancelReason = async (ctx, executionId, reason, executerId) => {
  try {
    console.log(`\n❌ === ОТМЕНА ЗАКАЗА ===`);
    console.log(`📋 Execution ID: ${executionId}`);
    console.log(`📝 Причина: ${reason}`);

    const response = await fetch(`${API_URL}/api/executers/cancel-execution/${executionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        executerId: executerId,
        reason: reason
      })
    });

    if (!response.ok) {
      return ctx.reply('❌ Ошибка при отмене заказа');
    }

    const result = await response.json();
    console.log(`✅ Заказ ${result.order_number} отменен`);

    await ctx.reply(
      `❌ *Заказ отменен*\n\n` +
      `📋 Номер заказа: *${result.order_number}*\n` +
      `📝 Причина: ${reason}\n` +
      `⏰ Отменен: ${new Date().toLocaleString()}\n\n` +
      `Заказ перемещен в архив.`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );

    await logActivity(executerId, 'cancel_execution', `Отменен заказ ${result.order_number}. Причина: ${reason}`, null, executionId);

  } catch (error) {
    console.error('❌ Ошибка при отмене заказа:', error);
    ctx.reply('❌ Произошла ошибка при отмене заказа');
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

// Управление выполнением заказа
const manageExecution = async (ctx, executionId, executerId) => {
  try {
    console.log(`\n🔧 === УПРАВЛЕНИЕ ЗАКАЗОМ ===`);
    console.log(`📋 Execution ID: ${executionId}`);

    // Получаем детали выполнения
    const response = await fetch(`${API_URL}/api/executers/execution/${executionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при получении деталей заказа');
    }

    const execution = await response.json();
    console.log(`📋 Заказ: ${execution.order_number}, Статус: ${execution.status}`);

    // Создаем кнопки управления
    const managementButtons = [];

    if (execution.status === 'pending' || execution.status === 'in_progress') {
      managementButtons.push([
        Markup.button.callback('✅ Завершить заказ', `complete_execution_${execution.id}`)
      ]);
    }

    if (execution.status !== 'completed' && execution.status !== 'cancelled') {
      managementButtons.push([
        Markup.button.callback('🔄 Заменить материал', `show_replacements_${execution.service_id}`)
      ]);
    }

    managementButtons.push([
      Markup.button.callback('📋 Назад к списку', 'show_active_executions')
    ]);

    const keyboard = Markup.inlineKeyboard(managementButtons);

    let message = `🔧 *Управление заказом #${execution.order_number}*\n\n`;
    message += `🎯 Услуга: ${execution.Service?.name || 'Не указана'}\n`;
    message += `📊 Статус: ${translateStatus(execution.status)}\n`;
    message += `📅 Создан: ${new Date(execution.created_at).toLocaleDateString()}\n`;

    if (execution.material_contents) {
      message += `📦 Материал: ${execution.material_contents.substring(0, 100)}${execution.material_contents.length > 100 ? '...' : ''}\n`;
    }

    if (execution.started_at) {
      message += `▶️ Начат: ${new Date(execution.started_at).toLocaleString()}\n`;
    }

    if (execution.completed_at) {
      message += `✅ Завершен: ${new Date(execution.completed_at).toLocaleString()}\n`;
    }

    message += '\n👆 Выберите действие:';

    await ctx.answerCbQuery();
    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    await logActivity(executerId, 'manage_execution', `Управление заказом ${execution.order_number}`, null, execution.id);

  } catch (error) {
    console.error('❌ Ошибка при управлении заказом:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Произошла ошибка при управлении заказом');
  }
};

// Завершить выполнение заказа
const completeExecution = async (ctx, executionId, executerId) => {
  try {
    console.log(`\n✅ === ЗАВЕРШЕНИЕ ЗАКАЗА ===`);
    console.log(`📋 Execution ID: ${executionId}`);

    // Завершаем выполнение
    const response = await fetch(`${API_URL}/api/executers/complete-execution/${executionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ executerId })
    });

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при завершении заказа');
    }

    const result = await response.json();
    console.log(`✅ Заказ ${result.order_number} завершен`);

    await ctx.answerCbQuery();
    ctx.reply(
      `✅ *Заказ завершен!*\n\n` +
      `📋 Номер заказа: *${result.order_number}*\n` +
      `🎯 Услуга: ${result.service_name}\n` +
      `⏰ Завершен: ${new Date().toLocaleString()}\n\n` +
      `Заказ успешно выполнен и перемещен в историю.`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );

    await logActivity(executerId, 'complete_execution', `Завершен заказ ${result.order_number}`, null, executionId);

  } catch (error) {
    console.error('❌ Ошибка при завершении заказа:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Произошла ошибка при завершении заказа');
  }
};

// Показать материалы для замены
const showReplacementMaterials = async (ctx, serviceId, executerId) => {
  try {
    console.log(`\n🔄 === ПОКАЗ МАТЕРИАЛОВ ДЛЯ ЗАМЕНЫ ===`);
    console.log(`🎯 Service ID: ${serviceId}`);

    // Получаем используемые материалы для этой услуги
    const response = await fetch(`${API_URL}/api/executers/used-materials/${serviceId}/${executerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Ошибка при получении материалов для замены');
    }

    const materials = await response.json();
    console.log(`📦 Найдено материалов для замены: ${materials.length}`);

    if (materials.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('❌ Нет материалов для замены. Сначала используйте материалы в заказах.');
    }

    // Создаем кнопки для каждого материала
    const materialButtons = materials.slice(0, 10).map(material => [
      Markup.button.callback(
        `🔄 ${material.contents.substring(0, 30)}...`,
        `replace_material_${material.id}_${serviceId}`
      )
    ]);

    const keyboard = Markup.inlineKeyboard(materialButtons);

    await ctx.answerCbQuery();
    ctx.reply(
      '🔄 *Выберите материал для замены:*\n\n' +
      'Эти материалы уже используются в ваших заказах:',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

  } catch (error) {
    console.error('❌ Ошибка при показе материалов для замены:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Произошла ошибка при получении материалов для замены');
  }
};

// Запросить замену материала
const requestMaterialReplacement = async (ctx, materialId, serviceId, executerId) => {
  try {
    const chatId = ctx.chat.id;

    // Сохраняем состояние ожидания ввода причины
    waitingForReason[chatId] = {
      materialId: materialId,
      executionId: serviceId // Используем serviceId как executionId для совместимости
    };

    await ctx.answerCbQuery();
    await ctx.reply('📝 Укажите причину замены материала:\n\nНапример: "Материал поврежден", "Неподходящий ключ", "Истек срок действия" и т.д.');

    await logActivity(executerId, 'request_replacement_start', `Начало запроса замены материала ID: ${materialId}`, null, serviceId);
  } catch (error) {
    await ctx.answerCbQuery();
    return ctx.reply('❌ Ошибка при запросе замены');
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
