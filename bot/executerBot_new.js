import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' });

// Токен бота и адрес API
const BOT_TOKEN = process.env.EXECUTER_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ Не найден токен бота! Установите EXECUTER_BOT_TOKEN в переменных окружения');
  process.exit(1);
}

console.log('🔑 Используется токен:', BOT_TOKEN.substring(0, 10) + '...');
console.log('🌐 API URL:', API_URL);

// Создание бота
const bot = new Telegraf(BOT_TOKEN);

// Хранение сессий пользователей
const userSessions = {};

// Состояния пользователей
const UserState = {
  IDLE: 'idle',
  WAITING_ORDER_NUMBER: 'waiting_order_number',
  VIEWING_ORDERS: 'viewing_orders',
  SELECTING_SERVICE: 'selecting_service'
};

// --- API функции ---

// Проверка воркера в системе
async function checkWorker(telegramId) {
  try {
    console.log(`🔍 Проверка воркера с telegram_id: ${telegramId}`);
    const response = await fetch(`${API_URL}/api/executers/admin/telegram/${telegramId}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.log(`❌ Воркер не найден: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Воркер найден: ${data.name}`);
    return data;
  } catch (error) {
    console.error('Ошибка проверки воркера:', error);
    return null;
  }
}

// Получение услуг воркера
async function getWorkerServices(telegramId) {
  try {
    console.log(`🔍 Получение услуг для telegram_id: ${telegramId}`);
    const response = await fetch(`${API_URL}/api/bot/services/${telegramId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Ошибка получения услуг: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Получено услуг: ${data.services?.length || 0}`);

    if (data.success) return data.services;
    throw new Error(data.error || 'Не удалось получить услуги');
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    throw error;
  }
}

// Создание заказа
async function createOrder(telegramId, serviceId, orderNumber) {
  try {
    console.log(`📝 Создание заказа: telegram_id=${telegramId}, service_id=${serviceId}, order_number=${orderNumber}`);

    const response = await fetch(`${API_URL}/api/bot/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, serviceId, orderNumber })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Ошибка создания заказа: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.success) {
      console.log(`✅ Заказ создан: ID ${data.order.id}`);
      return data;
    }

    throw new Error(data.error || 'Не удалось создать заказ');
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    throw error;
  }
}

// Получение заказов воркера
async function getWorkerOrders(telegramId) {
  try {
    console.log(`📋 Получение заказов для telegram_id: ${telegramId}`);

    const response = await fetch(`${API_URL}/api/bot/orders/${telegramId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Ошибка получения заказов: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.success) {
      console.log(`✅ Получено заказов: ${data.orders?.length || 0}`);
      return data.orders;
    }

    throw new Error(data.error || 'Не удалось получить заказы');
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    throw error;
  }
}

// --- Утилиты ---

function getUserSession(userId) {
  if (!userSessions[userId]) {
    userSessions[userId] = {
      state: UserState.IDLE,
      selectedService: null,
      worker: null
    };
  }
  return userSessions[userId];
}

function setUserState(userId, state, data = {}) {
  const session = getUserSession(userId);
  session.state = state;
  Object.assign(session, data);
}

// --- Обработчики команд ---

// Команда /start
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  try {
    // Проверяем воркера
    const worker = await checkWorker(telegramId);

    if (!worker) {
      return ctx.reply(
        '❌ Вы не зарегистрированы в системе как воркер.\n\n' +
        'Обратитесь к администратору для добавления в систему.'
      );
    }

    if (worker.status !== 'active') {
      return ctx.reply(
        '⚠️ Ваш аккаунт заблокирован или неактивен.\n\n' +
        'Обратитесь к администратору для разблокировки.'
      );
    }

    // Сохраняем данные воркера в сессии
    session.worker = worker;
    setUserState(telegramId, UserState.IDLE);

    await ctx.reply(
      `👋 Добро пожаловать, ${worker.name}!\n\n` +
      '🔧 Выберите действие:',
      Markup.keyboard([
        ['📋 Мои услуги', '📊 Мои заказы'],
        ['ℹ️ Помощь']
      ]).resize()
    );

  } catch (error) {
    console.error('Ошибка в команде /start:', error);
    await ctx.reply('❌ Произошла ошибка при авторизации. Попробуйте позже.');
  }
});

// Обработка кнопки "Мои услуги"
bot.hears('📋 Мои услуги', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  if (!session.worker) {
    return ctx.reply('❌ Сначала выполните команду /start');
  }

  try {
    const services = await getWorkerServices(telegramId);

    if (!services || services.length === 0) {
      return ctx.reply(
        '📋 У вас нет назначенных услуг.\n\n' +
        'Обратитесь к администратору для назначения услуг.',
        Markup.keyboard([
          ['📊 Мои заказы'],
          ['ℹ️ Помощь']
        ]).resize()
      );
    }

    // Создаем кнопки для каждой услуги
    const serviceButtons = services.map(service => [
      `🔧 ${service.name} (₽${service.price || 0})`
    ]);

    serviceButtons.push(['⬅️ Назад']);

    setUserState(telegramId, UserState.SELECTING_SERVICE, { services });

    await ctx.reply(
      '📋 Выберите услугу для создания заказа:\n\n' +
      services.map(s => `🔧 ${s.name} - ₽${s.price || 0}`).join('\n'),
      Markup.keyboard(serviceButtons).resize()
    );

  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    await ctx.reply('❌ Ошибка при загрузке услуг. Попробуйте позже.');
  }
});

// Обработка выбора услуги
bot.hears(/^🔧 (.+) \(₽(\d+)\)$/, async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  if (session.state !== UserState.SELECTING_SERVICE || !session.services) {
    return ctx.reply('❌ Сначала выберите "Мои услуги"');
  }

  const serviceName = ctx.match[1];
  const selectedService = session.services.find(s => s.name === serviceName);

  if (!selectedService) {
    return ctx.reply('❌ Услуга не найдена');
  }

  setUserState(telegramId, UserState.WAITING_ORDER_NUMBER, { selectedService });

  await ctx.reply(
    `📝 Выбрана услуга: ${selectedService.name}\n` +
    `💰 Цена: ₽${selectedService.price || 0}\n\n` +
    '📋 Введите номер заказа:',
    Markup.removeKeyboard()
  );
});

// Обработка ввода номера заказа
bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);
  const text = ctx.message.text;

  // Пропускаем команды и кнопки
  if (text.startsWith('/') || text.includes('📋') || text.includes('📊') || text.includes('ℹ️') || text.includes('⬅️')) {
    return;
  }

  if (session.state === UserState.WAITING_ORDER_NUMBER && session.selectedService) {
    const orderNumber = text.trim();

    if (!orderNumber) {
      return ctx.reply('❌ Номер заказа не может быть пустым. Введите номер заказа:');
    }

    try {
      const result = await createOrder(telegramId, session.selectedService.id, orderNumber);

      setUserState(telegramId, UserState.IDLE);

      await ctx.reply(
        `✅ Заказ успешно создан!\n\n` +
        `📋 Номер заказа: ${orderNumber}\n` +
        `🔧 Услуга: ${session.selectedService.name}\n` +
        `💰 Сумма: ₽${result.order.total_sum || session.selectedService.price || 0}\n` +
        `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}`,
        Markup.keyboard([
          ['📋 Мои услуги', '📊 Мои заказы'],
          ['ℹ️ Помощь']
        ]).resize()
      );

    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      await ctx.reply(
        '❌ Ошибка при создании заказа. Попробуйте еще раз.\n\n' +
        'Введите номер заказа:',
        Markup.removeKeyboard()
      );
    }
  }
});

// Обработка кнопки "Мои заказы"
bot.hears('📊 Мои заказы', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  if (!session.worker) {
    return ctx.reply('❌ Сначала выполните команду /start');
  }

  try {
    const orders = await getWorkerOrders(telegramId);

    if (!orders || orders.length === 0) {
      return ctx.reply(
        '📊 У вас пока нет заказов.\n\n' +
        'Создайте первый заказ через "Мои услуги".',
        Markup.keyboard([
          ['📋 Мои услуги'],
          ['ℹ️ Помощь']
        ]).resize()
      );
    }

    // Группируем заказы по статусам
    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
    const completedOrders = orders.filter(o => o.status === 'completed');

    let message = '📊 Ваши заказы:\n\n';

    if (activeOrders.length > 0) {
      message += '🔄 Активные заказы:\n';
      activeOrders.forEach(order => {
        message += `📋 ${order.order_number} - ${order.Service?.name || 'Услуга'}\n`;
        message += `💰 ₽${order.total_sum || 0} | 📅 ${new Date(order.created_at).toLocaleDateString('ru-RU')}\n\n`;
      });
    }

    if (completedOrders.length > 0) {
      message += '✅ Завершенные заказы:\n';
      completedOrders.slice(0, 5).forEach(order => {
        message += `📋 ${order.order_number} - ${order.Service?.name || 'Услуга'}\n`;
        message += `💰 ₽${order.total_sum || 0} | 📅 ${new Date(order.created_at).toLocaleDateString('ru-RU')}\n\n`;
      });

      if (completedOrders.length > 5) {
        message += `... и еще ${completedOrders.length - 5} завершенных заказов\n\n`;
      }
    }

    message += `📈 Всего заказов: ${orders.length}`;

    await ctx.reply(message, Markup.keyboard([
      ['📋 Мои услуги', '📊 Мои заказы'],
      ['ℹ️ Помощь']
    ]).resize());

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    await ctx.reply('❌ Ошибка при загрузке заказов. Попробуйте позже.');
  }
});

// Обработка кнопки "Назад"
bot.hears('⬅️ Назад', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  if (!session.worker) {
    return ctx.reply('❌ Сначала выполните команду /start');
  }

  setUserState(telegramId, UserState.IDLE);

  await ctx.reply(
    `👋 Добро пожаловать, ${session.worker.name}!\n\n` +
    '🔧 Выберите действие:',
    Markup.keyboard([
      ['📋 Мои услуги', '📊 Мои заказы'],
      ['ℹ️ Помощь']
    ]).resize()
  );
});

// Команда помощи
bot.hears('ℹ️ Помощь', async (ctx) => {
  await ctx.reply(
    'ℹ️ Помощь по работе с ботом:\n\n' +
    '📋 Мои услуги - просмотр назначенных услуг и создание заказов\n' +
    '📊 Мои заказы - просмотр истории заказов\n\n' +
    '📝 Как создать заказ:\n' +
    '1. Нажмите "Мои услуги"\n' +
    '2. Выберите нужную услугу\n' +
    '3. Введите номер заказа\n' +
    '4. Заказ будет создан автоматически\n\n' +
    '❓ По вопросам обращайтесь к администратору.',
    Markup.keyboard([
      ['📋 Мои услуги', '📊 Мои заказы'],
      ['ℹ️ Помощь']
    ]).resize()
  );
});

// Обработка неизвестных команд
bot.on('message', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getUserSession(telegramId);

  if (!session.worker) {
    return ctx.reply('❌ Сначала выполните команду /start');
  }

  await ctx.reply(
    '❓ Неизвестная команда.\n\n' +
    'Используйте кнопки меню или команду /start',
    Markup.keyboard([
      ['📋 Мои услуги', '📊 Мои заказы'],
      ['ℹ️ Помощь']
    ]).resize()
  );
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.reply('❌ Произошла внутренняя ошибка. Попробуйте позже или обратитесь к администратору.');
});

// Запуск бота
console.log('🤖 Запуск бота для воркеров...');
bot.launch()
  .then(() => {
    console.log('✅ Бот для воркеров успешно запущен!');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
