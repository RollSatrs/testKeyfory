// Тест для проверки функции showMyServices без внешних зависимостей
import { Services, Executer, ServiceAccess } from './backend/database/dbTables.js';

console.log('🔍 === ТЕСТ ФУНКЦИИ showMyServices (СИМУЛЯЦИЯ) ===\n');

async function simulateShowMyServices() {
  try {
    const executerId = 20;
    console.log(`👤 Executer ID: ${executerId}`);

    // Симулируем логику из executerBotRoute.js
    console.log('🔍 Поиск услуг через ServiceAccess...');
    const accessServices = await ServiceAccess.findAll({
      where: { executer_id: executerId },
      include: [{ model: Services, as: 'Service' }]
    });

    console.log('🔍 Поиск услуг через прямое назначение...');
    const assignedServices = await Services.findAll({
      where: { executer_id: executerId }
    });

    // Объединяем уникальные услуги
    const allServices = [];
    const addedIds = new Set();

    // Добавляем услуги из ServiceAccess
    accessServices.forEach(access => {
      if (access.Service && !addedIds.has(access.Service.id)) {
        allServices.push(access.Service);
        addedIds.add(access.Service.id);
      }
    });

    // Добавляем услуги из прямого назначения
    assignedServices.forEach(service => {
      if (!addedIds.has(service.id)) {
        allServices.push(service);
        addedIds.add(service.id);
      }
    });

    console.log(`📋 Найдено услуг: ${allServices.length}`);

    if (allServices.length === 0) {
      console.log('❌ ПРОБЛЕМА: Нет услуг для отображения!');
      return;
    }

    // Симулируем создание inline кнопок
    console.log('\n🎯 СОЗДАНИЕ INLINE КНОПОК:');
    const serviceButtons = allServices.map(service => {
      const buttonText = `🎯 ${service.name}`;
      const callbackData = `select_service_${service.id}`;
      console.log(`- Кнопка: "${buttonText}" -> ${callbackData}`);
      return [{ text: buttonText, callback_data: callbackData }];
    });

    console.log('\n✅ INLINE КНОПКИ ДОЛЖНЫ ОТОБРАЖАТЬСЯ В БОТЕ!');
    console.log(`Количество кнопок: ${serviceButtons.length}`);

    // Симулируем сообщение
    let message = '🎯 *Мои услуги*\n\n';
    message += 'Выберите услугу для работы:\n\n';

    allServices.forEach((service, index) => {
      message += `${index + 1}. *${service.name}*\n`;
      message += `   💰 Цена: ${service.price}₽\n`;
      message += `   📂 Категория: ${service.category || 'Не указана'}\n\n`;
    });

    message += '👆 Нажмите на кнопку услуги ниже';

    console.log('\n📱 СООБЩЕНИЕ ДЛЯ БОТА:');
    console.log(message);

  } catch (error) {
    console.error('❌ Ошибка при симуляции:', error);
  }

  process.exit(0);
}

simulateShowMyServices();
