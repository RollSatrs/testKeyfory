import { Telegraf, Markup, session } from 'telegraf';
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
dotenv.config({ path: envPath });

// Конфигурация
const BOT_TOKEN = process.env.EXECUTER_BOT_TOKEN;
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ EXECUTER_BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

// Lightweight fetch wrapper that mimics axios response shape { status, data, ok }
const buildQuery = (params) => {
  if (!params) return '';
  const esc = encodeURIComponent;
  const parts = Object.keys(params).map(k => `${esc(k)}=${esc(params[k])}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const fetchAsAxios = async (method, path, body = null, params = null) => {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  return { status: res.status, data, ok: res.ok, statusText: res.statusText };
};

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

// Перевод статуса исполнения на удобочитаемый русский текст
const translateStatus = (status) => {
  if (!status && status !== '') return 'Неизвестно';
  const s = String(status).toLowerCase();
  switch (s) {
    case 'in_progress':
    case 'in-progress':
    case 'inprogress':
      return 'В процессе';
    case 'pending':
    case 'new':
      return 'Ожидает';
    case 'active':
      return 'Активен';
    case 'completed':
    case 'done':
      return 'Выполнен';
    case 'cancelled':
    case 'canceled':
      return 'Отменён';
    case 'failed':
      return 'Ошибка';
    default:
      // Если статус пустая строка or null-like, show a friendly dash
      if (s === '' || s === 'null' || s === 'undefined') return '—';
      // Возвращаем исходный статус как fallback
      return status;
  }
};

// Форматирование цены для отображения: возвращает "123₽" для чисел, "0₽" для 0, и "не указана" для пустых/некорректных значений
const formatPrice = (value) => {
  // Explicitly treat null/undefined/empty-string as unspecified
  if (value === null || typeof value === 'undefined' || value === '') return 'не указана';

  // If value is an object with amount/price fields, try to extract
  if (typeof value === 'object') {
    if (typeof value.price !== 'undefined') value = value.price;
    else if (typeof value.amount !== 'undefined') value = value.amount;
    else return 'не указана';
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return 'не указана';

  // Show numeric value, including 0
  return `${n}₽`;
};

// Универсальная функция расчета общего заработка исполнителя
const calculateTotalEarnings = async (executerId) => {
  try {
    // Получаем выполненные заказы
    const completedResponse = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${executerId}`);
    const completedOrdersData = completedResponse.data || [];

    // Получаем индивидуальные цены исполнителя
    const servicesResponse = await fetchAsAxios('GET', `/api/executers-bot/services/${executerId}`);
    const executerServices = servicesResponse.data || [];

    // Рассчитываем общий заработок
    const totalEarnings = completedOrdersData.reduce((sum, order) => {
      const executerService = executerServices.find(es => es.id === order.service_id);

      let orderPrice = 0;
      if (executerService && executerService.price) {
        orderPrice = executerService.price;
      } else if (order.Service?.price) {
        orderPrice = order.Service.price;
      }

      return sum + orderPrice;
    }, 0);

    console.log(`💰 Calculated total earnings: ${totalEarnings}₽ from ${completedOrdersData.length} orders (executerId: ${executerId})`);
    return totalEarnings;
  } catch (error) {
    console.error('❌ Ошибка расчета общего заработка:', error.message);
    return 0;
  }
};

// Helper: определяем — отмечена ли услуга как "Выполнен" именно для этого исполнителя.
// Мы повторяем логику из `ServicesTable.jsx` чтобы бот фильтровал услуги так же, как админская таблица.
const isServiceCompletedForExecuter = (s, executerId = null, executerName = null) => {
  try {
    // Нормализатор исполнителя — аналогичный фронтенду
    const normalizeExecutor = (obj, fallbackPrefix = '') => {
      if (!obj) return { key: null, name: '—' };
      const id = obj.executer_id ?? obj.executer?.id ?? obj.executer?.user_id ?? obj.id ?? null;
      const name = obj.executer_name ?? obj.executer?.name ?? obj.name ?? (id ? `ID: ${id}` : null) ?? '—';
      const key = id != null ? String(id) : `${fallbackPrefix}:${String(name)}`;
      return { key: String(key), name };
    };

    // Собираем execMap как в таблице: key -> { name, label }
    const execMap = new Map();

    // 1) seed from assigned_executers (preserve order semantics)
    const assigned = Array.isArray(s.assigned_executers) ? s.assigned_executers : [];
    for (const a of assigned) {
      const { key, name } = normalizeExecutor(a, 'assigned');
      const raw = (a.status || (a.Executer && a.Executer.status) || '').toString().toLowerCase();
      const label = raw === 'inactive' ? 'Неактивен' : 'Активен';
      if (key) execMap.set(key, { name, label });
    }

    // 2) completed_orders mark as Выполнен for executor present there
    if (Array.isArray(s.completed_orders)) {
      for (const o of s.completed_orders) {
        if (!o) continue;
        // completed_orders entries may be plain numbers/strings or objects
        if (typeof o === 'object') {
          const { key, name } = normalizeExecutor(o, 'completed');
          if (!key) continue;
          execMap.set(key, { name, label: 'Выполнен' });
        } else {
          // plain order number — no executor info
          continue;
        }
      }
    }

    // 3) active_orders: if not already Выполнен mark Активен or Выполнен per order status
    const activeOrders = Array.isArray(s.active_orders) ? s.active_orders : [];
    for (const o of activeOrders) {
      if (!o) continue;
      if (typeof o === 'object') {
        const { key, name } = normalizeExecutor(o, 'active');
        if (!key) continue;
        const prev = execMap.get(key);
        if (prev && prev.label === 'Выполнен') continue; // keep Выполнен
        const raw = (o.status || o.state || '').toString().toLowerCase();
        const isCompleted = raw.includes('completed') || raw.includes('выполн') || raw.includes('done') || raw.includes('заверш');
        const label = isCompleted ? 'Выполнен' : 'Активен';
        execMap.set(key, { name, label });
      }
    }

    // 4) also support a field completed_executers that may list ids/names
    if (Array.isArray(s.completed_executers)) {
      for (const x of s.completed_executers) {
        if (!x) continue;
        if (typeof x === 'object') {
          const id = x.id ?? x.executer_id ?? x.user_id ?? null;
          const name = x.name ?? x.executer_name ?? null;
          const key = id != null ? String(id) : `completed:${String(name || '—')}`;
          execMap.set(String(key), { name: name || '—', label: 'Выполнен' });
        } else {
          // x may be an id or name
          const key = String(x);
          execMap.set(key, { name: String(x), label: 'Выполнен' });
        }
      }
    }

    // Merge by name with priority (Выполнен > Активен > Неактивен)
    const priority = (label) => (label === 'Выполнен' ? 3 : label === 'Активен' ? 2 : 1);
    const nameMap = new Map(); // name -> label
    for (const [, val] of execMap) {
      const nm = val.name || '—';
      const existing = nameMap.get(nm);
      if (!existing) nameMap.set(nm, val.label);
      else if (priority(val.label) > priority(existing)) nameMap.set(nm, val.label);
    }

    // Now check whether current executor is present and has label 'Выполнен'
    // Try matching by id first, then by name
    if (executerId != null) {
      // direct key by id
      const idKey = String(executerId);
      const byId = execMap.get(idKey);
      if (byId && byId.label === 'Выполнен') return true;
    }

    if (executerName) {
      const byName = nameMap.get(String(executerName));
      if (byName === 'Выполнен') return true;
    }

    // Also check keys that might encode name fallback keys like 'assigned:Name' or 'completed:Name'
    // Search execMap for entries whose name matches executor name and label is Выполнен
    if (executerName) {
      for (const [, val] of execMap) {
        if (!val || !val.name) continue;
        if (String(val.name) === String(executerName) && val.label === 'Выполнен') return true;
      }
    }

    return false;
  } catch (err) {
    if (DEBUG_BOT_SERVICES) console.log('isServiceCompletedForExecuter error:', err && err.message);
    return false;
  }
};

const filterVisibleServices = (services, executerId = null, executerName = null) => {
  return (Array.isArray(services) ? services : []).filter(s => !isServiceCompletedForExecuter(s, executerId, executerName));
};

// Debug flag — включаем всегда, чтобы бот печатал детали запроса/фильтрации услуг
// (ранее использовался процесс.env, теперь включён постоянно по требованию пользователя)
const DEBUG_BOT_SERVICES = true;

// Команда /start
// Команда /start
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const firstName = ctx.from.first_name || 'Пользователь';

  [{ text: '📋 Активные услуги' }, { text: '📊 Статистика' }],
    console.log(`📋 Активные услуги: ${telegramId}`);
    console.log(`👋 Имя: ${firstName}`);

    // Авторизация исполнителя
    const response = await fetchAsAxios('POST', '/api/executers/auth', {
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

      // Получаем актуальный общий заработок через нашу универсальную функцию
      let balanceToShow = 0;
      try {
        balanceToShow = await calculateTotalEarnings(executerData.id);
      } catch (balanceErr) {
        console.warn('Не удалось рассчитать общий заработок, использую баланс из auth:', balanceErr.message);
        balanceToShow = executerData.balance || 0;
      }

      await ctx.reply(
        `🎉 *Добро пожаловать, ${executerData.name || firstName}!*\n\n` +
        `✅ Авторизация успешна\n` +
        `🆔 ID исполнителя: ${executerData.id}\n` +
        `💰 Общий заработок: ${balanceToShow || 0}₽\n\n` +
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

const logActivity = async (executerId, action, description, orderId = null) => {
  try {
    await fetchAsAxios('POST', '/api/executers/log', {
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
  [{ text: '🛠️ Мои услуги' }],
  [{ text: '� Активные услуги' }, { text: '📊 Статистика' }],
  [{ text: '✅ Выполненные услуги' }]
    ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
};

// Показать список услуг, доступных исполнителю (включая индивидуальные цены)
const showMyServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n🛠️ === МОИ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

    const response = await fetchAsAxios('GET', `/api/executers-bot/services/${session.executerId}`);
    const services = response.data || [];

    // Доп. проверка: получаем все выполненные этим исполнителем заказы
    // и собираем service_id, чтобы однозначно определить, какие услуги он уже завершал.
    let completedServiceIds = new Set();
    try {
      const compResp = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
      const completedOrders = compResp.data || [];
      for (const o of (Array.isArray(completedOrders) ? completedOrders : [])) {
        const sid = o.service_id ?? o.Service?.id ?? o.serviceId ?? null;
        if (sid != null) completedServiceIds.add(String(sid));
      }
      if (DEBUG_BOT_SERVICES) console.log(`DEBUG_BOT_SERVICES: completedServiceIds for executer ${session.executerId}:`, Array.from(completedServiceIds));
    } catch (e) {
      if (DEBUG_BOT_SERVICES) console.log('DEBUG_BOT_SERVICES: failed to load completed-orders for executer:', e.message);
    }

    if (DEBUG_BOT_SERVICES) {
      console.log('DEBUG_BOT_SERVICES: /services response raw:', JSON.stringify(response.data, null, 2));
    }

    // Используем общую функцию фильтрации, но логируем per-service детали
    const visibleServices = [];
    for (const s of (Array.isArray(services) ? services : [])) {
      try {
        const completedOrdersField = s.completed_orders;
        const completedCountField = s.completed_count ?? s.completedCount;
        const lastExec = s.lastExecution ?? s.last_execution ?? s.execution ?? null;
        const execStatus = (s.executionStatus || s.execution_status || (lastExec && (lastExec.status || lastExec.state)) || '').toString();

  // Если есть явные completed service_id из completed-orders — помечаем как выполненную
  const completedForExec = completedServiceIds.has(String(s.id)) || isServiceCompletedForExecuter(s, session.executerId, session.name);

        if (DEBUG_BOT_SERVICES) {
          console.log(
            `DEBUG_SERVICES: id=${s.id} name="${s.name}" completed_count=${completedCountField} ` +
            `execStatus="${execStatus}" completed_orders=${Array.isArray(completedOrdersField) ? completedOrdersField.length : String(completedOrdersField)} ` +
            `lastExec=${lastExec ? JSON.stringify(lastExec) : 'null'} -> completedForThisExec=${completedForExec}`
          );
        }

        if (!completedForExec) visibleServices.push(s);
      } catch (err) {
        console.log('DEBUG_SERVICES: error evaluating service', s && s.id, err.message);
        visibleServices.push(s);
      }
    }

    if (!Array.isArray(visibleServices) || visibleServices.length === 0) {
      // Получаем общий заработок даже когда нет доступных услуг
      let balanceToShow = 0;
      try {
        balanceToShow = await calculateTotalEarnings(session.executerId);
      } catch (statsErr) {
        console.warn('Не удалось рассчитать заработок для моих услуг:', statsErr.message);
        balanceToShow = session.balance || 0;
      }

      return ctx.reply(`🛠️ *Мои услуги:*\n\n💰 Общий заработок: ${balanceToShow}₽\n\n❌ У вас пока нет доступных услуг`, { parse_mode: 'Markdown', ...getMainMenu() });
    }

    // Получаем общий заработок для показа
    let balanceToShow = 0;
    try {
      balanceToShow = await calculateTotalEarnings(session.executerId);
    } catch (statsErr) {
      console.warn('Не удалось рассчитать заработок для моих услуг:', statsErr.message);
      balanceToShow = session.balance || 0;
    }

    let msg = `🛠️ *Мои услуги:*\n\n💰 Общий заработок: ${balanceToShow}₽\n\nВыберите услугу, чтобы создать заказ:`;

    const keyboard = (Array.isArray(visibleServices) ? visibleServices : []).map(s => [{ text: `${s.name} — ${formatPrice(s.price)}`, callback_data: `select_service_${s.id}` }]);

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });

    await logActivity(session.executerId, 'view_my_services', 'Просмотр моих услуг');
  } catch (error) {
    console.error('❌ Ошибка получения моих услуг:', error);
    ctx.reply('❌ Ошибка при получении услуг');
  }
};

// ==================== КОМАНДЫ ====================

// (Основные команды и обработчики идут ниже)

// NOTE: "Мои услуги" flow removed from main menu per request. Service selection and creation
// via bot are intentionally not exposed in the keyboard anymore.

// Показать активные услуги
const showActiveServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📋 === АКТИВНЫЕ УСЛУГИ ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

  const response = await fetchAsAxios('GET', `/api/executers-bot/active-executions/${session.executerId}`);

    // Получаем общий заработок через универсальную функцию
    let balanceToShow = 0;
    try {
      balanceToShow = await calculateTotalEarnings(session.executerId);
    } catch (statsErr) {
      console.warn('Не удалось рассчитать заработок для активных услуг:', statsErr.message);
      balanceToShow = session.balance || 0;
    }

    // Дополнительная фильтрация на стороне бота - убираем отмененные и завершенные заказы
    const activeOrdersSource = Array.isArray(response.data) ? response.data : [];
    if (!Array.isArray(response.data)) {
      console.warn('WARN: unexpected active-executions response shape:', response.data);
    }

    const activeOrders = activeOrdersSource.filter((order) => {
      try {
        // Exclude completed/cancelled orders regardless of source shape
        const rawStatus = (order.status || order.state || '').toString().toLowerCase();
        if (/completed|done|выполн|заверш|cancel|отмен/.test(rawStatus)) return false;

        // Проверяем что заказ активен и услуга существует и активна
        const hasActiveService = order.Service && (order.Service.status === 'active' || order.Service.status === '' || order.Service.status == null);
        const hasValidStatus = ['pending', 'active', 'in_progress'].includes(rawStatus) || rawStatus === '';

        console.log(`📋 Заказ ${order.order_number}: статус=${order.status}, услуга=${order.Service?.name}, активна=${hasActiveService}`);

        return hasActiveService && hasValidStatus;
      } catch (err) {
        return false;
      }
    });

    if (activeOrders.length === 0) {
      // Если активных заказов нет — показываем доступные исполнителю услуги,
      // чтобы после назначения услуги админом исполнитель мог её увидеть и создать заказ.
      try {
        const servicesResp = await fetchAsAxios('GET', `/api/executers-bot/services/${session.executerId}`);
        if (DEBUG_BOT_SERVICES) console.log('DEBUG_BOT_SERVICES: /services fallback raw:', JSON.stringify(servicesResp.data, null, 2));
        const services = servicesResp.data || [];

        // Получим выполненные заказы для фолбэка тоже
        let completedServiceIdsFallback = new Set();
        try {
          const compResp = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
          const completedOrders = compResp.data || [];
          for (const o of (Array.isArray(completedOrders) ? completedOrders : [])) {
            const sid = o.service_id ?? o.Service?.id ?? o.serviceId ?? null;
            if (sid != null) completedServiceIdsFallback.add(String(sid));
          }
          if (DEBUG_BOT_SERVICES) console.log(`DEBUG_BOT_SERVICES: completedServiceIdsFallback for executer ${session.executerId}:`, Array.from(completedServiceIdsFallback));
        } catch (e) {
          if (DEBUG_BOT_SERVICES) console.log('DEBUG_BOT_SERVICES: failed to load completed-orders for executer (fallback):', e.message);
        }

        // Log per-service and filter using helper
        const availableServices = [];
        for (const s of (Array.isArray(services) ? services : [])) {
          try {
            const completedForExec = completedServiceIdsFallback.has(String(s.id)) || isServiceCompletedForExecuter(s, session.executerId, session.name);
            if (DEBUG_BOT_SERVICES) {
              console.log(`DEBUG_SERVICES(fallback): id=${s.id} name="${s.name}" completedForThisExec=${completedForExec}`);
            }
            if (!completedForExec) availableServices.push(s);
          } catch (err) {
            if (DEBUG_BOT_SERVICES) console.log('DEBUG_SERVICES(fallback): error', err.message);
            availableServices.push(s);
          }
        }

        if (Array.isArray(availableServices) && availableServices.length > 0) {
          let msg = `📋 *Активные услуги:*\n\n`;
          msg += `💰 Общий заработок: ${balanceToShow}₽\n\n`;
          msg += `🔎 Ниже перечислены услуги, к которым у вас есть доступ. Выберите услугу, чтобы создать заказ:`;

          const keyboard = availableServices.map(s => [{ text: `${s.name} — ${formatPrice(s.price)}`, callback_data: `select_service_${s.id}` }]);

          await ctx.reply(msg, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
          });

          await logActivity(session.executerId, 'view_available_services', 'Просмотр доступных услуг (fallback from active)');
          return;
        }
      } catch (svcErr) {
        console.warn('Не удалось получить список услуг для исполнителя (fallback):', svcErr.message);
      }

      return ctx.reply(
        `📋 *Активные услуги:*\n\n` +
        `💰 Общий заработок: ${balanceToShow}₽\n\n` +
        '❌ У вас нет активных услуг.\n' +
        '📦 Расходники закончились.',
        { parse_mode: 'Markdown', ...getMainMenu() }
      );
    }

    // Создаем кнопки для управления заказами
    const orderButtons = activeOrders.map(order => [
      { text: `📋 ${order.order_number} - ${order.Service?.name || 'Услуга'}`, callback_data: `manage_order_${order.order_number}` }
    ]);

  let message = '📋 *Ваши активные услуги:*\n\n';
  message += `💰 Общий заработок: ${balanceToShow}₽\n\n`;
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

// Показать статистику
const showStatistics = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📊 === СТАТИСТИКА ===`);
    console.log(`👤 Executer ID: ${session.executerId}`);

  const response = await fetchAsAxios('GET', `/api/executers-bot/stats/${session.executerId}`);
  const stats = response.data || {};

    // Получаем выполненные заказы и рассчитываем заработок через универсальную функцию
    let completedOrdersData = [];
    let totalEarningsCalculated = 0;

    try {
      const completedResponse = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
      completedOrdersData = completedResponse.data || [];

      // Используем нашу универсальную функцию для расчета заработка
      totalEarningsCalculated = await calculateTotalEarnings(session.executerId);
    } catch (earningsError) {
      console.error('❌ Ошибка расчета заработка:', earningsError.message);
    }

    const message =
      '📊 *Ваша статистика:*\n\n' +
      `✅ Выполненных заказов: **${completedOrdersData.length || stats.completedOrders || 0}**\n` +
      `📋 Активных заказов: **${stats.activeOrders || 0}**\n` +
      `💰 Общий заработок: **${totalEarningsCalculated || stats.totalEarnings || 0}₽**\n` +
      `🔄 Запросов на замену: **${stats.replacementRequests || 0}**\n\n`;

    // Показываем последние выполненные заказы
    let recentOrdersMessage = '';
    if (completedOrdersData.length > 0) {
      recentOrdersMessage += `\n📋 *Последние выполненные заказы:*\n\n`;

      // Получаем индивидуальные цены исполнителя для услуг (для отображения)
      let executerServicesForDisplay = [];
      try {
    const servicesResponse = await fetchAsAxios('GET', `/api/executers-bot/services/${session.executerId}`);
    executerServicesForDisplay = servicesResponse.data || [];
      } catch (servicesError) {
        console.error('❌ Ошибка получения услуг для отображения:', servicesError.message);
      }

      completedOrdersData.slice(0, 5).forEach((order, index) => {
        // Определяем цену с учетом индивидуальных настроек
        const executerService = executerServicesForDisplay.find(es => es.id === order.service_id);
                const displayPriceRaw = executerService?.price ?? order.Service?.price ?? null;
        const priceSource = executerService?.price ? '(ваша цена)' : '(стандартная)';

                recentOrdersMessage += `${index + 1}. #${order.order_number} - ${order.Service?.name || 'Услуга'} (${formatPrice(displayPriceRaw)} ${priceSource})\n`;
      });
      recentOrdersMessage += `\n`;
    }

    const finalMessage = message + recentOrdersMessage + `📅 Данные обновлены: ${new Date().toLocaleDateString()}`;

    await ctx.reply(finalMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 Главное меню', callback_data: 'main_menu' }
        ]]
      }
    });

    await logActivity(session.executerId, 'view_statistics', 'Просмотр статистики и выполненных заказов');

  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    ctx.reply('❌ Ошибка при получении статистики');
  }
};

// Показать выполненные услуги (заказы)
const showCompletedServices = async (ctx) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    const response = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
    const completed = response.data || [];

    // Получаем общий заработок
    let balanceToShow = 0;
    try {
      balanceToShow = await calculateTotalEarnings(session.executerId);
    } catch (statsErr) {
      console.warn('Не удалось рассчитать заработок для выполненных услуг:', statsErr.message);
      balanceToShow = session.balance || 0;
    }

    if (!Array.isArray(completed) || completed.length === 0) {
      return ctx.reply(`✅ *Выполненные услуги:*\n\n💰 Общий заработок: ${balanceToShow}₽\n\n❌ У вас пока нет выполненных услуг`, { parse_mode: 'Markdown', ...getMainMenu() });
    }

    // Build a clean multi-line block per completed order (no buttons)
    const parts = [];
    parts.push(`✅ *Выполненные услуги*\n\n💰 Общий заработок: ${balanceToShow}₽`);

    completed.forEach((order) => {
      const serviceName = order.Service?.name || order.service_name || order.name || 'Услуга';
      const priceRaw = order.price ?? order.Service?.price ?? null;
      const standardPrice = order.Service?.price ?? order.standard_price ?? priceRaw;
      const createdAt = order.completed_at || order.created_at ? new Date(order.completed_at || order.created_at).toLocaleDateString() : '—';
      const id = order.id || order.execution_id || order.executionId || '—';
      const statusText = (order.status === 'completed' || order.status === 'done') ? 'Выполнен' : translateStatus(order.status || 'completed');

      const block = [];
      block.push('Заказ');
      block.push('');
      block.push(`🎵 ${serviceName}`);
      block.push(`💰 Цена: ${formatPrice(priceRaw)} (стандартная цена — ${formatPrice(standardPrice)})`);
      block.push(`📅 Дата: ${createdAt}`);
      block.push(`🆔 ID: ${id}`);
      block.push(`📌 Статус: ${statusText}`);
      parts.push(block.join('\n'));
    });

    const finalMessage = parts.join('\n\n');

    await ctx.reply(finalMessage, {
      parse_mode: 'Markdown',
      ...getMainMenu()
    });

    await logActivity(session.executerId, 'view_completed_services', 'Просмотр выполненных услуг');

  } catch (error) {
    console.error('❌ Ошибка получения выполненных услуг:', error);
    ctx.reply('❌ Ошибка при получении выполненных услуг');
  }
};

// Обработчик просмотра материалов выполненного заказа
bot.action(/^view_completed_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderNumber = ctx.match[1];
    // Покажем материалы так же, как showMaterialsText
    await showMaterialsText(ctx, orderNumber);
  } catch (error) {
    console.error('❌ Ошибка view_completed handler:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при отображении выполненного заказа');
  }
});

// Управление заказом
const manageOrder = async (ctx, orderNumber) => {
  try {
    const session = userSessions[ctx.chat.id];
    if (!session?.authenticated) return ctx.reply('❌ Необходима авторизация. Нажмите /start');

    console.log(`\n🎯 === УПРАВЛЕНИЕ ЗАКАЗОМ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    // Получаем информацию о заказе через execution ID
    const activeOrdersResponse = await fetchAsAxios('GET', `/api/executers-bot/active-executions/${session.executerId}`);
    const activeOrdersList = Array.isArray(activeOrdersResponse.data) ? activeOrdersResponse.data : [];

    // Находим заказ по номеру — сравниваем как строки
    let orderExecution = activeOrdersList.find(order => String(order.order_number) === String(orderNumber));
    let orderData = null;

    // Фолбэк: попробуем получить execution по номеру заказа
    if (!orderExecution) {
      try {
        const execByOrderResp = await fetchAsAxios('GET', `/api/executers-bot/execution-by-order/${orderNumber}`);
        if (execByOrderResp?.data?.success && execByOrderResp.data.data) {
          const info = execByOrderResp.data.data;
          orderExecution = {
            id: info.id || null,
            service_id: info.service_id || info.serviceId || null,
            executer_id: info.executer_id || session.executerId,
            order_number: info.order_number || orderNumber,
            status: info.status || 'in_progress',
            created_at: info.created_at || info.createdAt,
            Service: info.Service || { name: info.serviceName, price: info.price }
          };
          console.log('✅ Заказ найден через execution-by-order:', orderExecution.order_number);
        }
      } catch (execErr) {
        console.warn('⚠️ execution-by-order фолбэк не сработал:', execErr.message);
      }
    }

    // Еще фолбэк: общая информация о заказе
    if (!orderExecution) {
      try {
        const orderInfoResp = await fetchAsAxios('GET', `/api/executers/order-info/${orderNumber}`);
        if (orderInfoResp?.data?.success && orderInfoResp.data.data) {
          const info = orderInfoResp.data.data;
          orderExecution = {
            id: info.id || null,
            service_id: info.serviceId || info.service_id || null,
            executer_id: session.executerId,
            order_number: info.orderNumber,
            status: info.status,
            created_at: info.createdAt,
            Service: { name: info.serviceName, price: info.price }
          };
          console.log('✅ Заказ найден через order-info:', orderExecution.order_number);
        }
      } catch (fallbackErr) {
        console.warn('⚠️ Фолбэк order-info не сработал:', fallbackErr.message);
      }
    }

    // Если у нас есть execution id — запрашиваем детали исполнения
    if (orderExecution?.id) {
      try {
        const orderResponse = await fetchAsAxios('GET', `/api/executers-bot/execution/${orderExecution.id}`);
        if (orderResponse?.data?.success) orderData = orderResponse.data.data;
      } catch (e) {
        console.warn('⚠️ Ошибка запроса execution by id:', e.message);
      }
    }

    // Если деталей по execution нет — используем orderExecution или общую инфу
    if (!orderData && orderExecution) {
      orderData = orderExecution;
    }

    if (!orderData) return ctx.reply('❌ Заказ не найден или недоступен');

    // Получаем материалы для заказа
    let orderMaterials = [];
    try {
      const materialsResponse = await fetchAsAxios('GET', `/api/executers-bot/order-materials/${orderNumber}`, null, { telegramId: session.telegramId });
      if (Array.isArray(materialsResponse.data)) orderMaterials = materialsResponse.data;
      else if (materialsResponse?.data?.success) orderMaterials = materialsResponse.data.data || [];
    } catch (materialError) {
      console.error('❌ Ошибка получения материалов:', materialError.message);
    }

    const hasMaterials = orderMaterials.length > 0;

    // Получаем общий заработок
    let balanceToShow = 0;
    try {
      balanceToShow = await calculateTotalEarnings(session.executerId);
    } catch (statsErr) {
      console.warn('Не удалось рассчитать заработок для управления заказом:', statsErr.message);
      balanceToShow = session.balance || 0;
    }

    let message = `🎯 *Управление заказом #${orderNumber}*\n\n💰 Общий заработок: ${balanceToShow}₽\n\n`;
    message += `🛠️ Услуга: ${orderData.Service?.name || 'Не указана'}\n`;
    message += `📊 Статус: ${translateStatus(orderData.status || 'active')}\n`;

    // Получаем индивидуальную цену для исполнителя
    try {
      const servicesResponse = await fetchAsAxios('GET', `/api/executers-bot/services/${session.executerId}`);
      const serviceWithPrice = (servicesResponse.data || []).find(s => s.id === orderData.service_id);
      const individualPrice = serviceWithPrice?.price ?? orderData.Service?.price ?? null;
      message += `💰 Ваша цена: ${formatPrice(individualPrice)}\n`;
    } catch (priceError) {
      message += `💰 Сумма: ${formatPrice(orderData.Service?.price ?? null)}\n`;
    }

    message += `📅 Создан: ${orderData.created_at ? new Date(orderData.created_at).toLocaleDateString() : 'Не указано'}\n\n`;

    if (hasMaterials) {
      // Показываем только ПЕРВЫЙ доступный материал (один расходник за раз)
      const assignedMaterial = orderMaterials[0]; // берем только первый материал
      message += `📦 *Ваш материал для этого заказа:*\n\n`;
      message += `\`${assignedMaterial.contents || assignedMaterial.name || 'Материал'}\`\n`;
      if (assignedMaterial.description) {
        message += `📝 ${assignedMaterial.description}\n`;
      }
      message += '\n_Материал выше можно скопировать_\n\n';

      // КРИТИЧЕСКИ ВАЖНО: Помечаем материал как использованный, чтобы другие исполнители его не получили
      try {
        console.log(`🔒 Помечаем материал ${assignedMaterial.id} как использованный для исполнителя ${session.executerId}`);
        const markUsedResponse = await fetchAsAxios('POST', `/api/executers/materials/${assignedMaterial.id}/mark-used`, {
          executerId: session.executerId,
          orderNumber: orderNumber,
          reason: 'Материал выдан исполнителю в управлении заказом'
        });

        if (markUsedResponse.ok) {
          console.log(`✅ Материал ${assignedMaterial.id} успешно помечен как использованный`);
        } else {
          console.error(`❌ Ошибка пометки материала ${assignedMaterial.id} как использованного:`, markUsedResponse.data);
        }
      } catch (markError) {
        console.error(`❌ Критическая ошибка при пометке материала как использованного:`, markError);
        // Продолжаем работу, но логируем ошибку для отслеживания
      }
    } else {
      message += `📦 Нет доступных материалов для этой услуги\n\n`;
    }

    message += `Выберите действие:`;

    const managementButtons = [];
    if (hasMaterials) {
      managementButtons.push([{ text: '🔄 Заменить материал', callback_data: `replace_materials_${orderNumber}` }]);
    } else {
      managementButtons.push([{ text: '📞 Обратиться к админу', callback_data: `contact_admin_${orderNumber}` }]);
    }

    managementButtons.push([
      { text: '✅ Выполнил услугу', callback_data: `complete_order_${orderNumber}` },
      { text: '❌ Не выполнил услугу', callback_data: `cancel_order_${orderNumber}` }
    ]);

    managementButtons.push([{ text: '🔙 К активным услугам', callback_data: 'back_to_active' }]);

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: managementButtons } });

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

  const response = await fetchAsAxios('GET', `/api/executers/materials/${orderNumber}`, null, { executerId: session.executerId });

    if (!response.data.success || response.data.data.length === 0) {
      // Получаем общий заработок даже когда нет материалов
      let balanceToShow = 0;
      try {
        balanceToShow = await calculateTotalEarnings(session.executerId);
      } catch (statsErr) {
        console.warn('Не удалось рассчитать заработок для пустых материалов:', statsErr.message);
        balanceToShow = session.balance || 0;
      }

      return ctx.reply(`📝 *Материалы для заказа #${orderNumber}*\n\n💰 Общий заработок: ${balanceToShow}₽\n\n📦 Материалы для этого заказа не назначены`, { parse_mode: 'Markdown' });
    }

    const materials = response.data.data;

    // Получаем общий заработок
    let balanceToShow = 0;
    try {
      balanceToShow = await calculateTotalEarnings(session.executerId);
    } catch (statsErr) {
      console.warn('Не удалось рассчитать заработок для материалов:', statsErr.message);
      balanceToShow = session.balance || 0;
    }

    let message = `📝 *Материал для заказа #${orderNumber}*\n\n💰 Общий заработок: ${balanceToShow}₽\n\n`;
    message += `_Вы можете скопировать текст ниже:_\n\n`;

    // Показываем только ПЕРВЫЙ материал (один расходник за раз)
    if (materials.length > 0) {
      const assignedMaterial = materials[0];
      message += `\`${assignedMaterial.contents || assignedMaterial.name || 'Материал'}\`\n`;
      if (assignedMaterial.description) {
        message += `📝 ${assignedMaterial.description}\n`;
      }
      if (assignedMaterial.quantity && assignedMaterial.unit) {
        message += `📦 Количество: ${assignedMaterial.quantity} ${assignedMaterial.unit}\n`;
      }

      // КРИТИЧЕСКИ ВАЖНО: Помечаем материал как использованный, чтобы другие исполнители его не получили
      try {
        console.log(`🔒 Помечаем материал ${assignedMaterial.id} как использованный для исполнителя ${session.executerId}`);
        const markUsedResponse = await fetchAsAxios('POST', `/api/executers/materials/${assignedMaterial.id}/mark-used`, {
          executerId: session.executerId,
          orderNumber: orderNumber,
          reason: 'Материал выдан исполнителю'
        });

        if (markUsedResponse.ok) {
          console.log(`✅ Материал ${assignedMaterial.id} успешно помечен как использованный`);
        } else {
          console.error(`❌ Ошибка пометки материала ${assignedMaterial.id} как использованного:`, markUsedResponse.data);
        }
      } catch (markError) {
        console.error(`❌ Критическая ошибка при пометке материала как использованного:`, markError);
        // Продолжаем работу, но логируем ошибку для отслеживания
      }
    }

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

  // Нормализуем текст: убираем возможные replacement-символы и приводим к компактному представлению
  const normalized = String(text || '').replace(/\uFFFD/g, '').replace(/\s+/g, ' ').trim();

  // Толерантная обработка: если текст содержит ключевые слова меню — направляем к нужным обработчикам.
  try {
    const lower = normalized.toLowerCase();
    if (/активн/i.test(lower) && /услуг/i.test(lower)) {
      await showActiveServices(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Активные услуги" (fuzzy)');
      return;
    }
    if (/выполнен/i.test(lower) && /услуг/i.test(lower)) {
      await showCompletedServices(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Выполненные услуги" (fuzzy)');
      return;
    }
    if (/статист/i.test(lower)) {
      await showStatistics(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Статистика" (fuzzy)');
      return;
    }
    if (/мои услуг/i.test(lower) || (/мои/.test(lower) && /услуг/i.test(lower))) {
      await showMyServices(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Мои услуги" (fuzzy)');
      return;
    }
  } catch (fuzzyErr) {
    console.warn('WARN: fuzzy menu matching failed:', fuzzyErr.message);
  }

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
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Мои услуги"');
      break;

    case '📋 Активные услуги':
      await showActiveServices(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Активные услуги"');
      break;

    case '📊 Статистика':
      await showStatistics(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Статистика"');
      break;

    case '✅ Выполненные услуги':
      await showCompletedServices(ctx);
      await logActivity(session.executerId, 'menu_navigation', 'Переход к разделу "Выполненные услуги"');
      break;

    default:
      ctx.reply(
        '❓ Неизвестная команда.\n\n' +
        'Используйте кнопки меню для навигации.',
        getMainMenu()
      );
      await logActivity(session.executerId, 'unknown_command', `Неизвестная команда: ${text}`);
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

    // Создаем ServiceExecution с автоматическим назначением материала
    const response = await fetchAsAxios('POST', '/api/executers/service-execution', {
      serviceId: waitingData.serviceId,
      executerId: session.executerId,
      orderNumber: orderNumber,
      autoAssignMaterial: true  // Добавляем флаг для автоматического назначения
    });

    if (response.data.success) {
      // Очищаем состояние ожидания
      delete waitingStates.orderNumber[chatId];

      // Небольшое подтверждение создания заказа, затем показываем экран управления заказом
      await ctx.reply(`✅ *Заказ #${orderNumber} создан!*\n\n🛠️ Услуга: ${waitingData.serviceName}\n📊 Статус: Активен`, { parse_mode: 'Markdown' });

      await logActivity(session.executerId, 'create_order', `Создан заказ #${orderNumber} для услуги "${waitingData.serviceName}".`, orderNumber);

      // Перенаправляем в единый экран управления заказом (тот же, что вызывается по кнопке)
      await manageOrder(ctx, orderNumber);
    } else {
      ctx.reply(`❌ Ошибка создания заказа: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ Ошибка создания заказа:', error);
    if (error.response?.data?.message) {
      ctx.reply(`❌ ${error.response.data.message}`);
    } else {
      ctx.reply('❌ Ошибка при создании заказа. Попробуйте еще раз.');
    }
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
    const response = await fetchAsAxios('POST', '/api/executers-bot/bot-cancel-order', {
      orderNumber: waitingData.orderNumber,
      telegramId: session.telegramId,
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

      await logActivity(session.executerId, 'cancel_order', `Не выполнил услугу #${waitingData.orderNumber}. Причина: ${reason}. Материалы возвращены.`, waitingData.orderNumber);
    } else {
      ctx.reply(`❌ Ошибка отмены заказа: ${response.data.message}`);
      await logActivity(session.executerId, 'cancel_order_failed', `Ошибка отмены заказа #${waitingData.orderNumber}: ${response.data.message}`, waitingData.orderNumber);
    }

  } catch (error) {
    console.error('❌ Ошибка отмены заказа:', error);
    ctx.reply('❌ Ошибка при отмене заказа. Попробуйте еще раз.');

    const session = userSessions[ctx.chat.id];
    if (session?.executerId) {
      await logActivity(session.executerId, 'cancel_order_error', `Системная ошибка при отмене заказа: ${error.message}`);
    }
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
    const response = await fetchAsAxios('POST', '/api/executers-bot/request-replacement', {
      orderNumber: waitingData.orderNumber,
      materialId: waitingData.materialId,
      telegramId: session.telegramId,
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

      await logActivity(session.executerId, 'request_replacement', `Запрос замены материала "${waitingData.materialName}" в заказе #${waitingData.orderNumber}. Причина: ${reason}`, waitingData.orderNumber);
    } else {
      ctx.reply(`❌ Ошибка отправки запроса: ${response.data.message}`);
      await logActivity(session.executerId, 'request_replacement_failed', `Ошибка запроса замены материала в заказе #${waitingData.orderNumber}: ${response.data.message}`, waitingData.orderNumber);
    }

  } catch (error) {
    console.error('❌ Ошибка запроса замены:', error);
    ctx.reply('❌ Ошибка при отправке запроса на замену. Попробуйте еще раз.');

    const session = userSessions[ctx.chat.id];
    if (session?.executerId) {
      await logActivity(session.executerId, 'request_replacement_error', `Системная ошибка при запросе замены материала: ${error.message}`);
    }
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
  const response = await fetchAsAxios('GET', `/api/executers-bot/services/${session.executerId}`);
  const servicesList = response.data || [];
  const service = servicesList.find(s => s.id == serviceId);

    // Re-check that this service is visible (not already completed by this executer)
    // Доп. проверка по completed-orders
    let serviceCompletedByExecuter = false;
    try {
      const compResp = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
      const completedOrders = compResp.data || [];
      if (Array.isArray(completedOrders)) {
        serviceCompletedByExecuter = completedOrders.some(o => String(o.service_id ?? o.Service?.id ?? o.serviceId ?? '') === String(serviceId));
      }
    } catch (e) {
      if (DEBUG_BOT_SERVICES) console.log('DEBUG_BOT_SERVICES: failed to load completed-orders for select_service recheck:', e.message);
    }

    if (service && (serviceCompletedByExecuter || isServiceCompletedForExecuter(service, session.executerId, session.name))) {
      if (DEBUG_BOT_SERVICES) console.log(`DEBUG_SERVICES: select blocked serviceId=${serviceId} for executer=${session.executerId}`);
      await ctx.reply('❌ Эта услуга уже выполнена вами и недоступна для повторного назначения.', getMainMenu());
      return;
    }

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
      `💰 Цена: ${formatPrice(service.price)}\n` +
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
    const response = await fetchAsAxios('GET', `/api/executers-bot/order-materials/${orderNumber}`, null, { telegramId: session.telegramId });

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

    // Если есть только один материал, сообщаем что заменить нечем
    if (materials.length === 1) {
      return ctx.reply(
        '❌ *Нет других материалов для замены*\n\n' +
        'Это единственный доступный материал для данной услуги.\n\n' +
        '📞 Обратитесь к администратору для добавления новых материалов.',
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

    // Автоматически заменяем на следующий доступный материал (второй в списке)
    const newMaterial = materials[1]; // берем второй материал как замену

    let message = `🔄 *Материал заменен для заказа #${orderNumber}*\n\n`;
    message += `✅ Новый материал:\n`;
    message += `\`${newMaterial.contents || newMaterial.name || 'Материал'}\`\n\n`;

    if (newMaterial.description) {
      message += `📝 ${newMaterial.description}\n\n`;
    }

    message += `_Материал выше можно скопировать_`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 К управлению заказом', callback_data: `manage_order_${orderNumber}` }
        ]]
      }
    });

  } catch (error) {
    console.error('❌ Ошибка показа материалов для замены:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при загрузке материалов для замены');
  }
});

// Запросить материалы (для заказов без материалов)
bot.action(/^request_materials_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderNumber = ctx.match[1];

    await ctx.reply(
      `📦 *Запрос материалов для заказа #${orderNumber}*\n\n` +
      `Материалы для данного заказа еще не назначены администратором.\n\n` +
      `📱 Обратитесь к администратору для назначения материалов к заказу.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 К управлению заказом', callback_data: `manage_order_${orderNumber}` }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('❌ Ошибка запроса материалов:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при запросе материалов');
  }
});

// Обратиться к админу (для заказов без материалов)
bot.action(/^contact_admin_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderNumber = ctx.match[1];

    await ctx.reply(
      `📞 *Обращение к администратору*\n\n` +
      `Заказ #${orderNumber} не имеет назначенных материалов.\n\n` +
      `📱 Обратитесь к администратору для:\n` +
      `• Назначения материалов к заказу\n` +
      `• Получения инструкций по выполнению\n` +
      `• Решения технических вопросов\n\n` +
      `📧 Контакты администратора будут предоставлены отдельно.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 К управлению заказом', callback_data: `manage_order_${orderNumber}` }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('❌ Ошибка обращения к админу:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при обращении к администратору');
  }
});

// Назначение материала на заказ
bot.action(/^assign_material_(.+)_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const orderNumber = ctx.match[1];
    const materialId = ctx.match[2];
    const chatId = ctx.chat.id;
    const session = userSessions[chatId];

    if (!session?.authenticated) {
      return ctx.reply('❌ Необходима авторизация. Нажмите /start');
    }

    console.log(`\n📦 === НАЗНАЧЕНИЕ МАТЕРИАЛА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`📦 Material ID: ${materialId}`);
    console.log(`👤 Telegram ID: ${session.telegramId}`);

    // Назначаем материал на заказ
    const response = await fetchAsAxios('POST', '/api/executers-bot/assign-material', {
      orderNumber: orderNumber,
      materialId: materialId,
      telegramId: session.telegramId
    });

    if (response.data && response.data.success) {
      await ctx.reply(`✅ Материал успешно назначен на заказ #${orderNumber}!`);

      // Возвращаемся к управлению заказом
      await manageOrder(ctx, orderNumber);
    } else {
      await ctx.reply(`❌ Ошибка при назначении материала: ${response.data?.error || 'Неизвестная ошибка'}`);
    }

  } catch (error) {
    console.error('❌ Ошибка назначения материала:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при назначении материала');
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
  const response = await fetchAsAxios('GET', `/api/executers-bot/order-materials/${orderNumber}`, null, { telegramId: session.telegramId });

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
    const response = await fetchAsAxios('POST', '/api/executers-bot/bot-complete-order', {
      orderNumber: orderNumber,
      telegramId: session.telegramId
    });

    if (response.data.success) {
      // Fetch the completed order to get its price and service name
      let executionDetails = null;
      try {
        const execResp = await fetchAsAxios('GET', `/api/executers-bot/execution-by-order/${orderNumber}`);
        executionDetails = execResp.data?.data || null;
      } catch (e) {
        console.warn('Не удалось получить детали выполненного заказа:', e.message);
      }

  const completedPriceRaw = executionDetails?.price ?? response.data.price ?? null;
      const serviceName = executionDetails?.Service?.name || response.data.serviceName || 'Услуга';

      let msg = `✅ *Заказ #${orderNumber} выполнен!*\n\n`;
      msg += `🎯 Услуга: *${serviceName}*\n`;
      // Show recent completed orders with prices
      try {
        const recentResp = await fetchAsAxios('GET', `/api/executers-bot/completed-orders/${session.executerId}`);
        const recent = recentResp.data || [];
        recent.slice(0, 5).forEach((o, i) => {
          const pRaw = o.price ?? o.Service?.price ?? null;
          msg += `${i + 1}. #${o.order_number} - ${o.Service?.name || 'Услуга'} — ${formatPrice(pRaw)}\n`;
        });
      } catch (e) {
        console.warn('Не удалось получить список выполненных заказов:', e.message);
      }

      msg += '\n🏠 Главное меню';

      await ctx.reply(msg, {
        parse_mode: 'Markdown',
        ...getMainMenu()
      });

      await logActivity(session.executerId, 'complete_order', `Выполнен заказ #${orderNumber}. Заработок добавлен к балансу.`, orderNumber);
      // Refresh active services so the completed order no longer appears
      try {
        await showActiveServices(ctx);
      } catch (e) {
        console.debug('Не удалось обновить список активных услуг сразу после выполнения:', e.message);
      }
    } else {
      ctx.reply(`❌ Ошибка выполнения заказа: ${response.data.message}`);
      await logActivity(session.executerId, 'complete_order_failed', `Ошибка выполнения заказа #${orderNumber}: ${response.data.message}`, orderNumber);
    }

  } catch (error) {
    console.error('❌ Ошибка выполнения заказа:', error);
    await ctx.answerCbQuery();
    ctx.reply('❌ Ошибка при выполнении заказа');

    const session = userSessions[ctx.chat.id];
    if (session?.executerId) {
      await logActivity(session.executerId, 'complete_order_error', `Системная ошибка при выполнении заказа: ${error.message}`);
    }
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
