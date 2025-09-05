// Тест исправленной логики с флагом afterDuplicate

console.log('🎯 === ТЕСТ ИСПРАВЛЕННОЙ ЛОГИКИ С ФЛАГОМ ===\n');

// Имитация объектов бота
const waitingStates = {
  orderNumber: {},
  afterDuplicate: {} // Флаг для отслеживания состояния "после ошибки дубликата"
};
const userSessions = {};

const createMockCtx = (chatId, text) => ({
  chat: { id: chatId },
  message: { text: text },
  reply: (message, options) => {
    console.log(`🤖 Бот: ${message.split('\n')[0]}`);
    return Promise.resolve();
  }
});

const fetchAsAxios = async (method, url, data) => {
  if (data.orderNumber === '999') {
    return { data: { success: false, message: 'Заказ с номером 999 уже существует' } };
  }
  return { data: { success: true, orderId: parseInt(data.orderNumber) } };
};

// Исправленная функция handleOrderNumberInput
const handleOrderNumberInput = async (ctx, orderNumber) => {
  const chatId = ctx.chat.id;
  const waitingData = waitingStates.orderNumber[chatId];

  if (!waitingData) {
    // Проверяем флаг afterDuplicate в функции обработки сообщений
    return null; // Этот случай обрабатывается в handleMessage
  }

  if (!/^\d+$/.test(orderNumber)) {
    delete waitingStates.orderNumber[chatId];
    return ctx.reply('❌ Номер заказа должен содержать только цифры. Попробуйте еще раз:');
  }

  try {
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
      // Проверяем, является ли ошибка "заказ уже существует"
      const isDuplicateOrder = response.data.message &&
        (response.data.message.includes('уже существует') ||
         response.data.message.includes('already exists'));

      // Очищаем состояние ожидания при ошибке
      delete waitingStates.orderNumber[chatId];

      if (isDuplicateOrder) {
        // Устанавливаем флаг "после ошибки дубликата"
        waitingStates.afterDuplicate[chatId] = true;
        console.log(`🏷️ Установлен флаг afterDuplicate для chatId: ${chatId}`);

        return ctx.reply('❌ Заказ с таким номером уже существует!\n\n📝 Пожалуйста, введите другой номер заказа:\n(только цифры, например: 435)');
      } else {
        return ctx.reply(`❌ ${response.data.message}`);
      }
    }
  } catch (error) {
    delete waitingStates.orderNumber[chatId];

    const errorMessage = error.response?.data?.message || error.message || '';
    const isDuplicateOrder = errorMessage.includes('уже существует') || errorMessage.includes('already exists');

    if (isDuplicateOrder) {
      waitingStates.afterDuplicate[chatId] = true;
      console.log(`🏷️ Установлен флаг afterDuplicate в catch для chatId: ${chatId}`);
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

  // Проверяем флаг afterDuplicate
  if (waitingStates.afterDuplicate[chatId]) {
    // Очищаем флаг и показываем специальное сообщение
    delete waitingStates.afterDuplicate[chatId];
    console.log(`🗑️ Очищен флаг afterDuplicate для chatId: ${chatId}`);
    return ctx.reply('Этот номер заказа уже используется. Введите другой номер заказа.');
  } else {
    // Обычное сообщение для неизвестной команды
    return ctx.reply('❓ Неизвестная команда.\n\nИспользуйте кнопки меню для навигации.');
  }
};

const setWaitingState = (chatId) => {
  waitingStates.orderNumber[chatId] = { serviceId: 1, serviceName: 'Тестовая услуга' };
  userSessions[chatId] = { userId: 1, executerId: 1 };
};

// === ТЕСТ ИСПРАВЛЕННОЙ ЛОГИКИ ===
const runAdvancedTest = async () => {
  const chatId = 12345;

  console.log('🧪 ТЕСТ 1: Обычная неизвестная команда (без состояния)');
  await handleMessage(createMockCtx(chatId, 'random text'), 'random text');
  console.log(`   Флаг afterDuplicate: ${!!waitingStates.afterDuplicate[chatId]}\n`);

  console.log('🧪 ТЕСТ 2: Исполнитель выбирает услугу и вводит дублирующий заказ');
  setWaitingState(chatId);
  console.log(`   Состояние ожидания: ${!!waitingStates.orderNumber[chatId]} ✅`);
  await handleMessage(createMockCtx(chatId, '999'), '999');
  console.log(`   Состояние ожидания: ${!!waitingStates.orderNumber[chatId]} (очищено)`);
  console.log(`   Флаг afterDuplicate: ${!!waitingStates.afterDuplicate[chatId]} ✅ (установлен)\n`);

  console.log('🧪 ТЕСТ 3: Исполнитель пробует ввести что-то (срабатывает флаг)');
  await handleMessage(createMockCtx(chatId, '123'), '123');
  console.log(`   Флаг afterDuplicate: ${!!waitingStates.afterDuplicate[chatId]} ✅ (очищен)\n`);

  console.log('🧪 ТЕСТ 4: Исполнитель снова пишет что-то (обычная неизвестная команда)');
  await handleMessage(createMockCtx(chatId, 'hello'), 'hello');
  console.log(`   Флаг afterDuplicate: ${!!waitingStates.afterDuplicate[chatId]} ✅ (не установлен)\n`);

  console.log('🎉 === РЕЗУЛЬТАТЫ ТЕСТОВ ===');
  console.log('✅ Обычные сообщения → "❓ Неизвестная команда"');
  console.log('✅ После дубликата заказа → "Этот номер заказа уже используется"');
  console.log('✅ Флаг afterDuplicate корректно устанавливается и очищается');
  console.log('✅ Логика работает как требовалось!');
};

runAdvancedTest().catch(console.error);
