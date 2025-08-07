import { Telegraf, Markup, session } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Простой путь к общему .env файлу в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Идем на 1 уровень вверх: bot -> testKeyfory
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log(`📄 [executerBot.js] Использую .env файл: ${envPath}`);
dotenv.config({ path: envPath });// Конфигурация
const BOT_TOKEN = process.env.EXECUTER_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ EXECUTER_BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

// Создание бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware для сессий
bot.use(session());

// Хранилище пользовательских сессий
const userSessions = {};

// Состояния ожидания ввода
const waitingStates = {
  orderNumber: {},
  cancellationReason: {},
  replacementReason: {}
};

console.log('🤖 Инициализация бота для исполнителей...');

// ==================== УТИЛИТЫ ====================

// Перевод статусов на русский
const translateStatus = (status) => {
  const statusMap = {
    'pending': '⏳ Ожидает',
    'active': '🔄 Активен',
    'in_progress': '🔄 В работе',
    'completed': '✅ Выполнен',
    'cancelled': '❌ Отменён'
  };
  return statusMap[status] || status;
};

// Функция логирования активности
const logActivity = async (executerId, action, description, orderId = null) => {
  try {
    await axios.post(`${API_BASE_URL}/api/executers/log`, {
      executerId,
      action,
      description,
      orderId
    });
  } catch (error) {
    console.error('❌ Ошибка логирования:', error.message);
  }
};

// Главное меню
const getMainMenu = () => {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🛠️ Мои услуги' }, { text: '📋 Активные услуги' }],
        [{ text: '✅ Выполненные услуги' }, { text: '📊 Статистика' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
};

// ==================== КОМАНДЫ ====================

// Команда /start
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const firstName = ctx.from.first_name || 'Пользователь';

    console.log(`\n🚀 === СТАРТ БОТА ===`);
    console.log(`👤 Telegram ID: ${telegramId}`);
    console.log(`👋 Имя: ${firstName}`);

    // Авторизация исполнителя
    const response = await axios.post(`${API_BASE_URL}/api/executers/auth`, {
      telegram_id: telegramId
    });

    if (response.data && response.data.id) {
      const executerData = response.data;

      // Сохраняем сессию
      userSessions[ctx.chat.id] = {
        executerId: executerData.id,
        telegramId: telegramId,
        name: executerData.name || firstName,
        authenticated: true
      };

      ctx.session = userSessions[ctx.chat.id];

      await ctx.reply(
        `🎉 *Добро пожаловать, ${executerData.name || firstName}!*\n\n` +
        `✅ Авторизация успешна\n` +
        `🆔 ID исполнителя: ${executerData.id}\n` +
        `� Баланс: ${executerData.balance || 0}₽\n` +
        `⭐ Рейтинг: ${executerData.rating || 0}\n\n` +
        `Выберите действие из меню:`,
        {
          parse_mode: 'Markdown',
          ...getMainMenu()
        }
      );

      await logActivity(executerData.id, 'login', 'Вход в систему');
    } else {
      await ctx.reply(
        `❌ *Ошибка авторизации*\n\n` +
        `Исполнитель с ID ${telegramId} не найден в системе.\n\n` +
        `📞 Обратитесь к администратору для регистрации.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('❌ Ошибка авторизации:', error);
    await ctx.reply(
      '❌ Произошла ошибка при авторизации.\n' +
      'Попробуйте позже или обратитесь к администратору.'
    );
  }
});

// Команда /id - получить свой Telegram ID
bot.command('id', (ctx) => {
  ctx.reply(`🆔 Ваш Telegram ID: \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
});

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

// Показать мои услуги
const showMyServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🛠️ === МОИ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

    const response = await axios.get(`${API_BASE_URL}/api/executers-bot/services/${session.executerId}`);

    // Дополнительная фильтрация на стороне бота - только активные услуги
    const activeServices = response.data.filter(service => {
      const isActive = service.status === 'active';
      console.log(`🛠️ Услуга ${service.name}: статус=${service.status}, активна=${isActive}`);
      return isActive;
    });

    if (activeServices.length === 0) {
      return ctx.reply(
        '🛠️ *Мои услуги*\n\n' +
        '❌ У вас нет доступных активных услуг.\n' +
        'Обратитесь к администратору для получения доступа.',
        { parse_mode: 'Markdown', ...getMainMenu() }
      );
    }

    // Создаем inline кнопки для услуг
    const serviceButtons = activeServices.map(service => [
      { text: `🛠️ ${service.name} - ${service.price}₽`, callback_data: `select_service_${service.id}` }
    ]);

    let message = '🛠️ *Ваши активные услуги:*\n\n';
    activeServices.forEach((service, index) => {
      message += `${index + 1}. **${service.name}**\n`;
      message += `   💰 Цена: ${service.price}₽\n`;
      message += `   📝 ${service.description || 'Описание отсутствует'}\n\n`;
    });

    message += '👆 Выберите услугу для создания заказа:';

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: serviceButtons }
    });

    await logActivity(session.executerId, 'view_services', 'Просмотр доступных услуг');

  } catch (error) {
    console.error('❌ Ошибка получения услуг:', error);
    ctx.reply('❌ Ошибка при получении списка услуг');
  }
};

// Показать активные услуги
const showActiveServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📋 === АКТИВНЫЕ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

    const response = await axios.get(`${API_BASE_URL}/api/executers-bot/active-executions/${session.executerId}`);

    // Дополнительная фильтрация на стороне бота - убираем отмененные и завершенные заказы
    const activeOrders = response.data.filter(order => {
      // Проверяем что заказ активен и услуга существует и активна
      const hasActiveService = order.Service && order.Service.status === 'active';
      const hasValidStatus = ['pending', 'active', 'in_progress'].includes(order.status);

      console.log(`📋 Заказ ${order.order_number}: статус=${order.status}, услуга=${order.Service?.name}, активна=${hasActiveService}`);

      return hasActiveService && hasValidStatus;
    });

    if (activeOrders.length === 0) {
      return ctx.reply(
        '📋 *Активные услуги*\n\n' +
        '❌ У вас нет активных услуг.\n' +
        'Создайте заказ через "🛠️ Мои услуги"',
        { parse_mode: 'Markdown', ...getMainMenu() }
      );
    }

    // Создаем кнопки для управления заказами
    const orderButtons = activeOrders.map(order => [
      { text: `📋 ${order.order_number} - ${order.Service?.name || 'Услуга'}`, callback_data: `manage_order_${order.order_number}` }
    ]);

    let message = '📋 *Ваши активные услуги:*\n\n';
    activeOrders.forEach((order, index) => {
      message += `${index + 1}. **Заказ #${order.order_number}**\n`;
      message += `   🛠️ Услуга: ${order.Service?.name || 'Не указана'}\n`;
      message += `   📊 Статус: ${translateStatus(order.status)}\n`;
      message += `   📅 Создан: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
    });

    message += '👆 Выберите заказ для управления:';

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: orderButtons }
    });

    await logActivity(session.executerId, 'view_active_orders', 'Просмотр активных заказов');

  } catch (error) {
    console.error('❌ Ошибка получения активных услуг:', error);
    ctx.reply('❌ Ошибка при получении активных услуг');
  }
};

// Показать выполненные услуги
const showCompletedServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n✅ === ВЫПОЛНЕННЫЕ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

    const response = await axios.get(`${API_BASE_URL}/api/executers-bot/completed-orders/${session.executerId}`);

    if (response.data.length === 0) {
      return ctx.reply(
        '✅ *Выполненные услуги*\n\n' +
        '❌ У вас нет выполненных услуг.\n' +
        'После завершения заказов они появятся здесь.',
        { parse_mode: 'Markdown', ...getMainMenu() }
      );
    }

    let message = '✅ *Ваши выполненные услуги:*\n\n';
    response.data.slice(0, 15).forEach((order, index) => {
      message += `${index + 1}. **Заказ #${order.order_number}**\n`;
      message += `   🛠️ Услуга: ${order.Service?.name || 'Не указана'}\n`;
      message += `   💰 Сумма: ${order.Service?.price || 'Не указана'}₽\n`;
      message += `   📅 Выполнен: ${new Date(order.updated_at).toLocaleDateString()}\n\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 Главное меню', callback_data: 'main_menu' }
        ]]
      }
    });

    await logActivity(session.executerId, 'view_completed_orders', 'Просмотр выполненных заказов');

  } catch (error) {
    console.error('❌ Ошибка получения выполненных услуг:', error);
    ctx.reply('❌ Ошибка при получении выполненных услуг');
  }
};

// Показать статистику
const showStatistics = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📊 === СТАТИСТИКА ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

    const response = await axios.get(`${API_BASE_URL}/api/executers-bot/stats/${session.executerId}`);
    const stats = response.data;

    const message =
      '📊 *Ваша статистика:*\n\n' +
      `✅ Выполненных заказов: **${stats.completedOrders || 0}**\n` +
      `📋 Активных заказов: **${stats.activeOrders || 0}**\n` +
      `💰 Общий заработок: **${stats.totalEarnings || 0}₽**\n` +
      `⭐ Рейтинг: **${stats.rating || 0}**\n` +
      `🔄 Запросов на замену: **${stats.replacementRequests || 0}**\n\n` +
      `📅 Данные обновлены: ${new Date().toLocaleDateString()}`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 Главное меню', callback_data: 'main_menu' }
        ]]
      }
    });

    await logActivity(session.executerId, 'view_statistics', 'Просмотр статистики');

  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    ctx.reply('❌ Ошибка при получении статистики');
  }
};

// Управление заказом
const manageOrder = async (ctx, orderNumber) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🎯 === УПРАВЛЕНИЕ ЗАКАЗОМ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    // Получаем информацию о заказе через execution ID
    const activeOrdersResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/active-executions/${session.executerId}`);

    if (!activeOrdersResponse.data || activeOrdersResponse.data.length === 0) {
      return ctx.reply('❌ Активные заказы не найдены');
    }

    // Находим заказ по номеру
    const orderExecution = activeOrdersResponse.data.find(order => order.order_number === orderNumber);

    if (!orderExecution) {
      return ctx.reply('❌ Заказ не найден или недоступен');
    }

    // Получаем детали заказа
    const orderResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/execution/${orderExecution.id}`);

    if (!orderResponse.data || !orderResponse.data.success) {
      return ctx.reply('❌ Заказ не найден или недоступен');
    }

    const orderData = orderResponse.data.data; // Используем .data.data для получения данных

    // Получаем материалы для заказа (используя service_id из заказа)
    const materialsResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/materials/${orderData.service_id}`);

    // Фильтруем материалы для конкретного заказа
    let orderMaterials = [];
    if (materialsResponse.data && materialsResponse.data.length > 0) {
      orderMaterials = materialsResponse.data.filter(material =>
        material.order_number && material.order_number.toString() === orderNumber.toString()
      );
    }

    const hasMaterials = orderMaterials.length > 0;

    let message = `🎯 *Управление заказом #${orderNumber}*\n\n`;
    message += `🛠️ Услуга: ${orderData.Service?.name || 'Не указана'}\n`;
    message += `📊 Статус: ${translateStatus(orderData.status || 'active')}\n`;

    // Получаем индивидуальную цену для исполнителя
    try {
      const servicesResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/services/${session.executerId}`);
      const serviceWithPrice = servicesResponse.data.find(s => s.id === orderData.service_id);
      const individualPrice = serviceWithPrice?.price || orderData.Service?.price || 'Не указана';
      message += `💰 Ваша цена: ${individualPrice}₽\n`;
    } catch (priceError) {
      message += `💰 Сумма: ${orderData.Service?.price || 'Не указана'}₽\n`;
    }

    message += `📅 Создан: ${orderData.created_at ? new Date(orderData.created_at).toLocaleDateString() : 'Не указано'}\n\n`;

    if (hasMaterials) {
      message += `📦 *Ваши материалы:*\n\n`;

      orderMaterials.forEach((material, index) => {
        message += `${index + 1}. \`${material.contents || material.name || 'Материал'}\`\n`;
        if (material.description) {
          message += `   📝 ${material.description}\n`;
        }
        message += '\n';
      });

      message += `_Материалы выше можно скопировать_\n\n`;
    } else {
      message += `📦 Материалы для заказа №${orderNumber} не назначены\n\n`;
    }

    message += `Выберите действие:`;

    // Создаем кнопки управления
    const managementButtons = [];

    if (hasMaterials) {
      managementButtons.push([
        { text: '🔄 Заменить материалы', callback_data: `replace_materials_${orderNumber}` }
      ]);
    }

    managementButtons.push([
      { text: '✅ Выполнить услугу', callback_data: `complete_order_${orderNumber}` },
      { text: '❌ Не выполнил услугу', callback_data: `cancel_order_${orderNumber}` }
    ]);

    managementButtons.push([
      { text: '🔙 К активным услугам', callback_data: 'back_to_active' }
    ]);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: managementButtons }
    });

  } catch (error) {
    console.error('❌ Ошибка управления заказом:', error);
    ctx.reply('❌ Ошибка при загрузке управления заказом');
  }
};

// Показать материалы в виде текста
const showMaterialsText = async (ctx, orderNumber) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📝 === МАТЕРИАЛЫ В ВИДЕ ТЕКСТА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    const response = await axios.get(`${API_BASE_URL}/api/executers/materials/${orderNumber}`, {
      params: { executerId: session.executerId }
    });

    if (!response.data.success || response.data.data.length === 0) {
      return ctx.reply('📦 Материалы для этого заказа не назначены');
    }

    const materials = response.data.data;

    let message = `📝 *Материалы для заказа #${orderNumber}*\n\n`;
    message += `_Вы можете скопировать текст ниже:_\n\n`;

    materials.forEach((material, index) => {
      message += `\`${material.contents || material.name || 'Материал'}\`\n`;
      if (material.description) {
        message += `📝 ${material.description}\n`;
      }
      if (material.quantity && material.unit) {
        message += `📦 Количество: ${material.quantity} ${material.unit}\n`;
      }
      message += '\n';
    });

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 К управлению заказом', callback_data: `manage_order_${orderNumber}` }
        ]]
      }
    });

    await logActivity(session.executerId, 'view_materials_text', `Просмотр материалов заказа ${orderNumber} в виде текста`);

  } catch (error) {
    console.error('❌ Ошибка показа материалов:', error);
    ctx.reply('❌ Ошибка при загрузке материалов');
  }
};

// ==================== ОБРАБОТЧИКИ ТЕКСТА ====================

// Обработка текстовых сообщений (кнопки главного меню)
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;

  // Проверка авторизации
  const session = userSessions[chatId];
  if (!session?.authenticated) {
    return ctx.reply('❌ Необходима авторизация. Нажмите /start');
  }

  console.log(`\n💬 === ТЕКСТОВОЕ СООБЩЕНИЕ ===`);
  console.log(`👤 User: ${ctx.from.first_name} (${ctx.from.id})`);
  console.log(`💬 Text: ${text}`);

  // Обработка состояний ожидания ввода
  if (waitingStates.orderNumber[chatId]) {
    return handleOrderNumberInput(ctx, text);
  }

  if (waitingStates.cancellationReason[chatId]) {
    return handleCancellationReasonInput(ctx, text);
  }

  if (waitingStates.replacementReason[chatId]) {
    return handleReplacementReasonInput(ctx, text);
  }

  // Обработка кнопок главного меню
  switch (text) {
    case '🛠️ Мои услуги':
      await showMyServices(ctx);
      break;

    case '📋 Активные услуги':
      await showActiveServices(ctx);
      break;

    case '✅ Выполненные услуги':
      await showCompletedServices(ctx);
      break;

    case '📊 Статистика':
      await showStatistics(ctx);
      break;

    default:
      ctx.reply(
        '❓ Неизвестная команда.\n\n' +
        'Используйте кнопки меню для навигации.',
        getMainMenu()
      );
  }
});

// ==================== ОБРАБОТЧИКИ ВВОДА ====================

// Обработка ввода номера заказа
const handleOrderNumberInput = async (ctx, orderNumber) => {
  try {
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];
    const waitingData = waitingStates.orderNumber[chatId];

    // Валидация номера заказа
    if (!/^\d+$/.test(orderNumber)) {
      return ctx.reply('❌ Номер заказа должен содержать только цифры. Попробуйте еще раз:');
    }

    console.log(`\n📝 === ВВОД НОМЕРА ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`🛠️ Service ID: ${waitingData.serviceId}`);

    // Создаем ServiceExecution
    const response = await axios.post(`${API_BASE_URL}/api/executers/service-execution`, {
      serviceId: waitingData.serviceId,
      executerId: session.executerId,
      orderNumber: orderNumber
    });

    if (response.data.success) {
      // Очищаем состояние ожидания
      delete waitingStates.orderNumber[chatId];

      // Получаем материалы для заказа
      let materialsMessage = '';
      let materialsButtons = [];

      try {
        console.log(`🔍 Получаем материалы для заказа ${orderNumber}, service_id из заказа`);

        // Сначала получаем информацию о заказе чтобы узнать service_id
        const orderResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/execution/${orderNumber}`);

        if (orderResponse.data.success && orderResponse.data.data) {
          const orderData = orderResponse.data.data;
          const serviceId = orderData.service_id;

          console.log(`📋 Service ID для заказа ${orderNumber}: ${serviceId}`);

          // Теперь получаем материалы по service_id
          const materialsResponse = await axios.get(`${API_BASE_URL}/api/executers-bot/materials/${serviceId}`);

          if (materialsResponse.data && materialsResponse.data.length > 0) {
            const allMaterials = materialsResponse.data;

            // Фильтруем материалы для этого конкретного заказа
            const orderMaterials = allMaterials.filter(material =>
              material.order_number && material.order_number.toString() === orderNumber.toString()
            );

            console.log(`📦 Всего материалов: ${allMaterials.length}, для заказа ${orderNumber}: ${orderMaterials.length}`);

            if (orderMaterials.length > 0) {
              materialsMessage = `\n\n📦 *Ваши материалы:*\n\n`;

              orderMaterials.forEach((material, index) => {
                materialsMessage += `${index + 1}. \`${material.contents || material.name || 'Материал'}\`\n`;
                if (material.description) {
                  materialsMessage += `   📝 ${material.description}\n`;
                }
                materialsMessage += '\n';
              });

              materialsMessage += `_Материалы выше можно скопировать_\n`;

              // Добавляем кнопку замены материалов
              materialsButtons = [
                [{ text: '🔄 Заменить материалы', callback_data: `replace_materials_${orderNumber}` }]
              ];
            } else {
              materialsMessage = `\n\n📦 Материалы для заказа №${orderNumber} пока не назначены администратором.`;
            }
          } else {
            materialsMessage = `\n\n📦 Материалы пока не назначены администратором.`;
          }
        } else {
          console.log(`❌ Не удалось получить информацию о заказе ${orderNumber}`);
          materialsMessage = `\n\n📦 Не удалось получить информацию о материалах.`;
        }
      } catch (materialError) {
        console.error('❌ Ошибка получения материалов:', materialError);
        materialsMessage = `\n\n📦 Ошибка загрузки материалов.`;
      }

      const buttons = [
        ...materialsButtons,
        [{ text: '🎯 Управлять заказом', callback_data: `manage_order_${orderNumber}` }],
        [{ text: '📋 Активные услуги', callback_data: 'back_to_active' }],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ];

      await ctx.reply(
        `✅ *Заказ #${orderNumber} создан!*\n\n` +
        `🛠️ Услуга: ${waitingData.serviceName}\n` +
        `📊 Статус: Активен` +
        materialsMessage,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );

      await logActivity(session.executerId, 'create_order', `Создан заказ ${orderNumber} для услуги ${waitingData.serviceName}`);
    } else {
      ctx.reply(`❌ Ошибка создания заказа: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ Ошибка создания заказа:', error);
    ctx.reply('❌ Ошибка при создании заказа. Попробуйте еще раз.');
  }
};

// Обработка ввода причины отмены
const handleCancellationReasonInput = async (ctx, reason) => {
  try {
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];
    const waitingData = waitingStates.cancellationReason[chatId];

    console.log(`\n❌ === ПРИЧИНА НЕВЫПОЛНЕНИЯ ===`);
    console.log(`📋 Order Number: ${waitingData.orderNumber}`);
    console.log(`📝 Reason: ${reason}`);

    // Отменяем заказ
    const response = await axios.post(`${API_BASE_URL}/api/executers-bot/cancel-order`, {
      orderNumber: waitingData.orderNumber,
      executerId: session.executerId,
      reason: reason
    });

    if (response.data.success) {
      // Очищаем состояние ожидания
      delete waitingStates.cancellationReason[chatId];

      await ctx.reply(
        `❌ *Услуга #${waitingData.orderNumber} не выполнена*\n\n` +
        `📝 Причина: ${reason}\n` +
        `🔄 Материалы возвращены в статус "Доступны"\n` +
        `🗑️ Заказ удален из системы\n\n` +
        `Заказ больше не отображается в активных услугах.`,
        {
          parse_mode: 'Markdown',
          ...getMainMenu()
        }
      );

      await logActivity(session.executerId, 'cancel_order', `Не выполнил услугу ${waitingData.orderNumber}. Причина: ${reason}`);
    } else {
      ctx.reply(`❌ Ошибка отмены заказа: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ Ошибка отмены заказа:', error);
    ctx.reply('❌ Ошибка при отмене заказа. Попробуйте еще раз.');
  }
};

// Обработка ввода причины замены материала
const handleReplacementReasonInput = async (ctx, reason) => {
  try {
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];
    const waitingData = waitingStates.replacementReason[chatId];

    console.log(`\n🔄 === ПРИЧИНА ЗАМЕНЫ ===`);
    console.log(`📋 Order Number: ${waitingData.orderNumber}`);
    console.log(`📦 Material ID: ${waitingData.materialId}`);
    console.log(`📝 Reason: ${reason}`);

    // Отправляем запрос на замену
    const response = await axios.post(`${API_BASE_URL}/api/executers/request-replacement`, {
      orderNumber: waitingData.orderNumber,
      materialId: waitingData.materialId,
      executerId: session.executerId,
      reason: reason
    });

    if (response.data.success) {
      // Очищаем состояние ожидания
      delete waitingStates.replacementReason[chatId];

      await ctx.reply(
        `🔄 *Заявка на замену отправлена!*\n\n` +
        `📋 Заказ: #${waitingData.orderNumber}\n` +
        `📦 Материал: ${waitingData.materialName}\n` +
        `📝 Причина: ${reason}\n\n` +
        `⏳ Ожидайте решения администратора.\n` +
        `📱 Вы получите уведомление о результате.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎯 К управлению заказом', callback_data: `manage_order_${waitingData.orderNumber}` }],
              [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        }
      );

      await logActivity(session.executerId, 'request_replacement', `Запрос замены материала в заказе ${waitingData.orderNumber}. Причина: ${reason}`);
    } else {
      ctx.reply(`❌ Ошибка отправки запроса: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ Ошибка запроса замены:', error);
    ctx.reply('❌ Ошибка при отправке запроса на замену. Попробуйте еще раз.');
  }
};

// ==================== CALLBACK ОБРАБОТЧИКИ ====================

// Выбор услуги
bot.action(/^select_service_(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const serviceId = ctx.match[1];
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🛠️ === ВЫБОР УСЛУГИ ===`);
    console.log(`🛠️ Service ID: ${serviceId}`);

    // Получаем информацию об услуге
    const response = await axios.get(`${API_BASE_URL}/api/executers-bot/services/${session.executerId}`);
    const service = response.data.find(s => s.id == serviceId);

    if (!service) {
      return ctx.reply('❌ Услуга не найдена');
    }

    // Устанавливаем состояние ожидания номера заказа
    waitingStates.orderNumber[chatId] = {
      serviceId: serviceId,
      serviceName: service.name
    };

    await ctx.reply(
      `🛠️ *Выбрана услуга: ${service.name}*\n\n` +
      `💰 Цена: ${service.price}₽\n` +
      `📝 ${service.description || 'Описание отсутствует'}\n\n` +
      `📝 **Введите номер заказа:**\n` +
      `(только цифры, например: 12345)`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '❌ Отмена', callback_data: 'cancel_input' }
          ]]
        }
      }
    );

  } catch (error) {
    console.error('❌ Ошибка выбора услуги:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при выборе услуги');
  }
});

// Управление заказом
bot.action(/^manage_order_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderNumber = ctx.match[1];
    await manageOrder(ctx, orderNumber);
  } catch (error) {
    console.error('❌ Ошибка управления заказом:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при загрузке управления заказом');
  }
});

// Показать материалы в виде текста
bot.action(/^show_materials_text_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderNumber = ctx.match[1];
    await showMaterialsText(ctx, orderNumber);
  } catch (error) {
    console.error('❌ Ошибка показа материалов:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при загрузке материалов');
  }
});

// Заменить материалы
bot.action(/^replace_materials_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const orderNumber = ctx.match[1];
    const session = userSessions[ctx.chat.id];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🔄 === ЗАМЕНА МАТЕРИАЛОВ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    // Получаем материалы заказа
    const response = await axios.get(`${API_BASE_URL}/api/executers/materials/${orderNumber}`, {
      params: { executerId: session.executerId }
    });

    if (!response.data.success || response.data.data.length === 0) {
      return ctx.reply(
        '❌ *Нет материалов для замены*\n\n' +
        'Для этого заказа не найдено материалов.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🔙 К управлению заказом', callback_data: `manage_order_${orderNumber}` }
            ]]
          }
        }
      );
    }

    const materials = response.data.data;

    // Создаем кнопки для каждого материала
    const materialButtons = materials.slice(0, 10).map(material => [{
      text: `🔄 ${(material.contents || material.name || 'Материал').substring(0, 35)}...`,
      callback_data: `select_material_${orderNumber}_${material.id}`
    }]);

    materialButtons.push([
      { text: '🔙 К управлению заказом', callback_data: `manage_order_${orderNumber}` }
    ]);

    let message = `🔄 *Замена материалов для заказа #${orderNumber}*\n\n`;
    message += `📦 Выберите материал, который нужно заменить:\n\n`;

    materials.forEach((material, index) => {
      message += `${index + 1}. ${(material.contents || material.name || 'Материал').substring(0, 50)}...\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: materialButtons }
    });

  } catch (error) {
    console.error('❌ Ошибка показа материалов для замены:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при загрузке материалов для замены');
  }
});

// Выбор материала для замены
bot.action(/^select_material_(.+)_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const orderNumber = ctx.match[1];
    const materialId = ctx.match[2];
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🔄 === ВЫБОР МАТЕРИАЛА ДЛЯ ЗАМЕНЫ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`📦 Material ID: ${materialId}`);

    // Получаем информацию о материале
    const response = await axios.get(`${API_BASE_URL}/api/executers/materials/${orderNumber}`, {
      params: { executerId: session.executerId }
    });

    if (!response.data.success) {
      return ctx.reply('❌ Ошибка получения информации о материале');
    }

    const material = response.data.data.find(m => m.id == materialId);
    if (!material) {
      return ctx.reply('❌ Материал не найден');
    }

    // Устанавливаем состояние ожидания причины замены
    waitingStates.replacementReason[chatId] = {
      orderNumber: orderNumber,
      materialId: materialId,
      materialName: material.contents || material.name || 'Материал'
    };

    await ctx.reply(
      `🔄 *Замена материала*\n\n` +
      `📦 Материал: \`${material.contents || material.name || 'Материал'}\`\n` +
      `📋 Заказ: #${orderNumber}\n\n` +
      `📝 **Укажите причину замены материала:**\n` +
      `Например: "Материал поврежден", "Неподходящий ключ", "Истек срок действия"`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '❌ Отмена', callback_data: `replace_materials_${orderNumber}` }
          ]]
        }
      }
    );

  } catch (error) {
    console.error('❌ Ошибка выбора материала:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при выборе материала');
  }
});

// Выполнить заказ
bot.action(/^complete_order_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery('✅ Выполняем заказ...');

    const orderNumber = ctx.match[1];
    const session = userSessions[ctx.chat.id];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n✅ === ВЫПОЛНЕНИЕ ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    // Выполняем заказ
    const response = await axios.post(`${API_BASE_URL}/api/executers-bot/complete-order`, {
      orderNumber: orderNumber,
      executerId: session.executerId
    });

    if (response.data.success) {
      await ctx.reply(
        `✅ *Заказ #${orderNumber} выполнен!*\n\n` +
        `🎉 Отличная работа! Заказ успешно завершен.\n\n` +
        `📊 Заказ перемещен в "Выполненные услуги"\n` +
        `💰 Заработок добавлен к балансу\n` +
        `📦 Материалы помечены как использованные`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Активные услуги', callback_data: 'back_to_active' }],
              [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        }
      );

      await logActivity(session.executerId, 'complete_order', `Выполнен заказ ${orderNumber}`);
    } else {
      ctx.reply(`❌ Ошибка выполнения заказа: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ Ошибка выполнения заказа:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при выполнении заказа');
  }
});

// Отменить заказ
bot.action(/^cancel_order_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const orderNumber = ctx.match[1];
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n❌ === НЕ ВЫПОЛНИЛ УСЛУГУ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    // Устанавливаем состояние ожидания причины отмены
    waitingStates.cancellationReason[chatId] = {
      orderNumber: orderNumber
    };

    await ctx.reply(
      `❌ *Не выполнил услугу #${orderNumber}*\n\n` +
      `📝 **Укажите причину невыполнения услуги:**\n` +
      `Например: "Нет нужных материалов", "Технические проблемы", "Не смог связаться с клиентом"`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 К управлению заказом', callback_data: `manage_order_${orderNumber}` }
          ]]
        }
      }
    );

  } catch (error) {
    console.error('❌ Ошибка отмены заказа:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при отмене заказа');
  }
});

// Навигационные кнопки
bot.action('back_to_active', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await showActiveServices(ctx);
  } catch (error) {
    console.error('❌ Ошибка возврата к активным услугам:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка навигации');
  }
});

bot.action('main_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.reply('🏠 Главное меню', getMainMenu());
  } catch (error) {
    console.error('❌ Ошибка возврата в главное меню:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка навигации');
  }
});

bot.action('cancel_input', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const chatId = ctx.chat.id;

    // Очищаем все состояния ожидания
    delete waitingStates.orderNumber[chatId];
    delete waitingStates.cancellationReason[chatId];
    delete waitingStates.replacementReason[chatId];

    ctx.reply('❌ Ввод отменен', getMainMenu());
  } catch (error) {
    console.error('❌ Ошибка отмены ввода:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка отмены');
  }
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка в боте:', err);
  ctx.reply('❌ Произошла внутренняя ошибка. Попробуйте позже.');
});

// ==================== ЗАПУСК БОТА ====================

// Запуск бота
bot.launch()
  .then(() => {
    console.log('🤖✅ Бот для исполнителей запущен успешно!');
    console.log(`🔗 API URL: ${API_BASE_URL}`);
    console.log(`🎯 Режим: ${process.env.NODE_ENV || 'development'}`);
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error.message);

    if (error.message.includes('401')) {
      console.error('💡 Проверьте правильность токена бота в .env файле');
      console.error('💡 Получите новый токен у @BotFather в Telegram');
    }

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Проверьте, что backend сервер запущен на правильном порту');
    }

    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаем работу бота...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаем работу бота...');
  bot.stop('SIGTERM');
  process.exit(0);
});

console.log('🤖 Бот для исполнителей готов к работе!');
