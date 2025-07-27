import { Material, Order, Services, Executer } from './database/dbTables.js';
import { sequelize } from './database/databaseOn.js';

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Проверяем таблицы
    console.log('\n📋 Проверяем заказы:');
    const orders = await Order.findAll({
      include: [
        { model: Services, attributes: ['name'] },
        { model: Executer, attributes: ['name'] }
      ]
    });
    console.log(`Найдено заказов: ${orders.length}`);
    orders.forEach(order => {
      console.log(`- Заказ #${order.id}: ${order.Service?.name} (Исполнитель: ${order.Executer?.name})`);
    });

    console.log('\n📦 Проверяем материалы:');
    const materials = await Material.findAll();
    console.log(`Найдено материалов: ${materials.length}`);
    materials.forEach(material => {
      console.log(`- Материал #${material.id}: ${material.type_key} (Заказ: ${material.order_id})`);
    });

    console.log('\n👥 Проверяем исполнителей:');
    const executers = await Executer.findAll();
    console.log(`Найдено исполнителей: ${executers.length}`);
    executers.forEach(executer => {
      console.log(`- Исполнитель #${executer.id}: ${executer.name} (Telegram: ${executer.telegram_id})`);
    });

    // Создадим тестовые данные если их нет
    if (materials.length === 0 && orders.length > 0) {
      console.log('\n🔧 Создаем тестовые материалы...');
      const firstOrder = orders[0];

      await Material.create({
        type_key: 'test_key',
        contents: 'Тестовое содержимое материала',
        status: 'available',
        source: 'manual',
        order_id: firstOrder.id,
        service_id: firstOrder.service_id
      });

      console.log(`✅ Создан тестовый материал для заказа #${firstOrder.id}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
