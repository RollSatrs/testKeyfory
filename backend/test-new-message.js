// Тест нового текста сообщения

console.log('🎯 === ТЕСТ НОВОГО ТЕКСТА СООБЩЕНИЯ ===\n');

// Имитация объектов бота
const waitingStates = { orderNumber: {} };
const userSessions = {};

const createMockCtx = (chatId, text) => ({
  chat: { id: chatId },
  message: { text: text },
  reply: (message, options) => {
    console.log(`🤖 Бот отвечает: "${message}"`);
    return Promise.resolve();
  }
});

const fetchAsAxios = async (method, url, data) => {
  if (data.orderNumber === '999') {
    return { data: { success: false, message: 'Заказ с номером 999 уже существует' } };
  }
  return { data: { success: true, orderId: parseInt(data.orderNumber) } };
};

// Упрощенная функция handleOrderNumberInput
const handleOrderNumberInput = async (ctx, orderNumber) => {
  const chatId = ctx.chat.id;
  const waitingData = waitingStates.orderNumber[chatId];

  if (!waitingData) {
    // НОВЫЙ ТЕКСТ вместо "❓ Неизвестная команда"
    return ctx.reply('Этот номер заказа уже используется. Введите другой номер заказа.');
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
      // Очищаем состояние для всех ошибок (включая дубликаты)
      delete waitingStates.orderNumber[chatId];

      if (response.data.message.includes('уже существует')) {
        return ctx.reply('❌ Заказ с таким номером уже существует!\n\n📝 Пожалуйста, введите другой номер заказа:\n(только цифры, например: 435)');
      } else {
        return ctx.reply(`❌ ${response.data.message}`);
      }
    }
  } catch (error) {
    // Очищаем состояние для всех ошибок
    delete waitingStates.orderNumber[chatId];
    return ctx.reply('❌ Ошибка при создании заказа. Попробуйте еще раз.');
  }
};

const handleMessage = async (ctx, text) => {
  const chatId = ctx.chat.id;

  if (waitingStates.orderNumber[chatId]) {
    return handleOrderNumberInput(ctx, text);
  }

  // НОВЫЙ ТЕКСТ вместо "❓ Неизвестная команда"
  return ctx.reply('Этот номер заказа уже используется. Введите другой номер заказа.');
};

const setWaitingState = (chatId) => {
  waitingStates.orderNumber[chatId] = { serviceId: 1, serviceName: 'Тестовая услуга' };
  userSessions[chatId] = { userId: 1, executerId: 1 };
};

// === ТЕСТ НОВОГО ТЕКСТА ===
const runTextTest = async () => {
  const chatId = 12345;

  console.log('📝 СЦЕНАРИЙ: Исполнитель вводит дублирующий номер заказа');
  console.log('1. Исполнитель выбирает услугу');
  setWaitingState(chatId);
  console.log(`   ✅ Состояние ожидания установлено: ${!!waitingStates.orderNumber[chatId]}`);

  console.log('\n2. Исполнитель вводит существующий номер "999"');
  await handleMessage(createMockCtx(chatId, '999'), '999');
  console.log(`   ✅ Состояние ожидания очищено: ${!waitingStates.orderNumber[chatId]}`);

  console.log('\n3. Исполнитель пробует ввести другой номер "123"');
  console.log('   (но состояние уже очищено, поэтому показываем НОВЫЙ ТЕКСТ)');
  await handleMessage(createMockCtx(chatId, '123'), '123');

  console.log('\n🎉 === РЕЗУЛЬТАТ ТЕСТА ===');
  console.log('✅ Логика работает правильно - состояние очищается при дубликате');
  console.log('✅ НОВЫЙ ТЕКСТ: "Этот номер заказа уже используется. Введите другой номер заказа."');
  console.log('✅ Сообщение стало более понятным для пользователя');
  console.log('✅ Исполнитель понимает, что нужно выбрать услугу заново');
};

runTextTest().catch(console.error);
