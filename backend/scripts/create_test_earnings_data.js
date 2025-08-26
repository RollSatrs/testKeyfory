import { ExecuterEarnings, Executer, Services, Order } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

async function createTestEarningsData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Получаем существующих исполнителей и услуги
    const executers = await Executer.findAll({ limit: 5 });
    const services = await Services.findAll({ limit: 5 });
    const orders = await Order.findAll({ limit: 10 });

    if (executers.length === 0) {
      console.log('❌ Нет исполнителей в базе данных');
      return;
    }

    if (services.length === 0) {
      console.log('❌ Нет услуг в базе данных');
      return;
    }

    console.log(`📊 Найдено ${executers.length} исполнителей и ${services.length} услуг`);

    // Создаем тестовые записи заработков
    const testEarnings = [];
    const statuses = ['pending', 'paid', 'cancelled'];

    for (let i = 0; i < 50; i++) {
      const executer = executers[Math.floor(Math.random() * executers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const order = orders.length > 0 ? orders[Math.floor(Math.random() * orders.length)] : null;

      const basePrice = service.price || 100;
      const customPrice = Math.random() > 0.5 ? basePrice + Math.floor(Math.random() * 50) : null;
      const amount = customPrice || basePrice;

      // Создаем даты от 30 дней назад до сегодня
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      // Создаем минимальный Order если его нет
      let orderId = null;
      if (order) {
        orderId = order.id;
      } else {
        try {
          const tempOrder = await Order.create({
            service_id: service.id,
            executer_id: executer.id,
            total_sum: amount,
            status: 'completed',
            payment_status: 'paid'
          });
          orderId = tempOrder.id;
        } catch (orderError) {
          console.warn('Не удалось создать Order, используем null');
          orderId = null;
        }
      }

      testEarnings.push({
        executer_id: executer.id,
        service_id: service.id,
        order_id: orderId,
        amount: amount,
        base_price: basePrice,
        custom_price: customPrice,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: date
      });
    }    // Добавляем записи в базу данных
    await ExecuterEarnings.bulkCreate(testEarnings);

    console.log(`✅ Создано ${testEarnings.length} тестовых записей заработков`);

    // Выводим статистику
    const totalAmount = testEarnings.reduce((sum, item) => sum + item.amount, 0);
    const pendingAmount = testEarnings.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = testEarnings.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);

    console.log(`💰 Общая сумма заработков: ${totalAmount}₽`);
    console.log(`⏳ К выплате: ${pendingAmount}₽`);
    console.log(`✅ Выплачено: ${paidAmount}₽`);

  } catch (error) {
    console.error('❌ Ошибка создания тестовых данных:', error);
  } finally {
    process.exit(0);
  }
}

// Запуск скрипта
createTestEarningsData();
