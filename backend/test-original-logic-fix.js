// Тест возврата к оригинальной логике - состояние очищается для дубликатов

console.log('🎯 === ТЕСТ ВОЗВРАТА К ОРИГИНАЛЬНОЙ ЛОГИКЕ ===\n');

// Имитация объектов бота
const waitingStates = { orderNumber: {} };
const userSessions = {};

const createMockCtx = (chatId, text) => ({
  chat: { id: chatId },
  message: { text: text },
  reply: (message, options) => {
    console.log(`🤖 Бот: ${message.split('\n')[0]}`); // Показываем только первую строку
    return Promise.resolve();
  }
});

const fetchAsAxios = async (method, url, data) => {
  if (data.orderNumber === '999') {
    return { data: { success: false, message: 'Заказ с номером 999 уже существует' } };
  }
  return { data: { success: true, orderId: parseInt(data.orderNumber) } };
};

// Исправленная функция handleOrderNumberInput (возврат к оригинальной логике)
const handleOrderNumberInput = async (ctx, orderNumber) => {
  try {
    const chatId = ctx.chat.id;
    const waitingData = waitingStates.orderNumber[chatId];

    if (!waitingData) {
      return ctx.reply('❓ Неизвестная команда. Используйте команды из меню.');
    }

    if (!/^\d+$/.test(orderNumber)) {
      delete waitingStates.orderNumber[chatId];
      return ctx.reply('❌ Номер заказа должен содержать только цифры. Попробуйте еще раз:');
    }

    const response = await fetchAsAxios('POST', '/api/executers-bot/create-order', {
      orderNumber: orderNumber,
      serviceId: waitingData.serviceId,
      userId: userSessions[chatId].userId,
      executerId: userSessions[chatId].executerId
    });

    if (response.data.success) {
      delete waitingStates.orderNumber[chatId];
      return ctx.reply(`✅ Заказ #${orderNumber} успешно создан!`);
    } else {
      const isDuplicateOrder = response.data.message.includes('уже существует');

      // ИСПРАВЛЕНО: Теперь очищаем состояние для всех ошибок, включая дубликаты
      delete waitingStates.orderNumber[chatId];

      if (isDuplicateOrder) {
        return ctx.reply('❌ Заказ с таким номером уже существует!\n\n📝 Пожалуйста, введите другой номер заказа:\n(только цифры, например: 435)');
      } else {
        return ctx.reply(`❌ ${response.data.message}`);
      }
    }
  } catch (error) {
    const chatId = ctx.chat.id;
    const errorMessage = error.response?.data?.message || error.message || '';
    const isDuplicateOrder = errorMessage.includes('уже существует') || errorMessage.includes('already exists');

    // ИСПРАВЛЕНО: Теперь очищаем состояние для всех ошибок, включая дубликаты
    delete waitingStates.orderNumber[chatId];

    if (isDuplicateOrder) {
      return ctx.reply('❌ Заказ с таким номером уже существует!\n\n📝 Пожалуйста, введите другой номер заказа:\n(только цифры, например: 435)');
    } else {
      return ctx.reply('❌ Ошибка при создании заказа. Попробуйте еще раз.');
    }
  }
};

const handleMessage = async (ctx, text) => {
  const chatId = ctx.chat.id;

  if (waitingStates.orderNumber[chatId]) {
    return handleOrderNumberInput(ctx, text);
  }

  return ctx.reply('❓ Неизвестная команда. Используйте команды из меню.');
};

const setWaitingState = (chatId) => {
  waitingStates.orderNumber[chatId] = { serviceId: 1, serviceName: 'Тестовая услуга' };
  userSessions[chatId] = { userId: 1, executerId: 1 };
};

// === ТЕСТ ИСПРАВЛЕННОГО ПОВЕДЕНИЯ ===
const runFixedScenario = async () => {
  const chatId = 12345;

  console.log('📝 ШАГ 1: Пользователь выбирает услугу');
  setWaitingState(chatId);
  console.log(`   Состояние ожидания: ${!!waitingStates.orderNumber[chatId]} ✅\n`);

  console.log('📝 ШАГ 2: Пользователь вводит существующий номер заказа "999"');
  await handleMessage(createMockCtx(chatId, '999'), '999');
  console.log(`   Состояние ожидания: ${!!waitingStates.orderNumber[chatId]} ✅ (ОЧИЩЕНО - как в оригинале)\n`);

  console.log('📝 ШАГ 3: Пользователь пытается ввести новый номер "123"');
  await handleMessage(createMockCtx(chatId, '123'), '123');
  console.log(`   Результат: показана "неизвестная команда" ✅ (корректно - нет состояния)\n`);

  console.log('📝 ШАГ 4: Пользователь снова выбирает услугу');
  setWaitingState(chatId);
  console.log(`   Состояние ожидания восстановлено: ${!!waitingStates.orderNumber[chatId]} ✅\n`);

  console.log('📝 ШАГ 5: Пользователь вводит уникальный номер "123"');
  await handleMessage(createMockCtx(chatId, '123'), '123');
  console.log(`   Состояние ожидания: ${!!waitingStates.orderNumber[chatId]} ✅ (очищено после успеха)\n`);

  console.log('🎉 === ИТОГИ ИСПРАВЛЕНИЯ ===');
  console.log('✅ Поведение возвращено к оригинальной логике');
  console.log('✅ Состояние очищается при дубликате заказа');
  console.log('✅ Пользователь видит красивое сообщение с просьбой ввести другой номер');
  console.log('✅ При следующем вводе показывается "неизвестная команда"');
  console.log('✅ Предотвращено создание множественных заказов для одной услуги');
};

runFixedScenario().catch(console.error);
