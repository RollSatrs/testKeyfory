import { Order } from './dbTables.js';
import { sequelize } from './databaseOn.js';

// Миграция для заполнения существующих заказов номерами
async function migrateOrderNumbers() {
  try {
    console.log('🔄 Начинается миграция номеров заказов...');

    // Находим все заказы без номера
    const ordersWithoutNumber = await Order.findAll({
      where: {
        order_number: null
      }
    });

    console.log(`📊 Найдено заказов без номера: ${ordersWithoutNumber.length}`);

    if (ordersWithoutNumber.length === 0) {
      console.log('✅ Все заказы уже имеют номера');
      return;
    }

    // Заполняем номера для существующих заказов
    for (const order of ordersWithoutNumber) {
      const orderNumber = `ORD-${order.id.toString().padStart(6, '0')}`;
      await order.update({ order_number: orderNumber });
      console.log(`✅ Заказ ID ${order.id} получил номер: ${orderNumber}`);
    }

    console.log('🎉 Миграция номеров заказов завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка миграции номеров заказов:', error);
    throw error;
  }
}

export { migrateOrderNumbers };
