import dotenv from 'dotenv';
import { sequelize } from './database/databaseOn.js';
import { Order, Services, Material } from './database/dbTables.js';

// Загружаем переменные окружения
dotenv.config({ path: '../.env' });

async function checkOrderDetails() {
  try {
    console.log('✅ Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Проверяем структуру заказов
    console.log('\n📋 Проверяем заказы и их details:');
    const orders = await Order.findAll({
      include: [
        {
          model: Services,
          attributes: ['id', 'name']
        }
      ]
    });

    if (orders.length === 0) {
      console.log('❌ Заказы не найдены');
      return;
    }

    orders.forEach(order => {
      console.log(`\n📋 Заказ #${order.id}:`);
      console.log(`  📝 Услуга: ${order.Service?.name || 'Не указана'}`);
      console.log(`  📊 Статус: ${order.status}`);
      console.log(`  📦 Details:`, order.details);
      console.log(`  📦 Details тип:`, typeof order.details);

      if (order.details) {
        console.log(`  📦 Details содержимое:`, JSON.stringify(order.details, null, 4));
      }
    });

    // Проверяем также материалы для сравнения
    console.log('\n📦 Проверяем материалы:');
    const materials = await Material.findAll();

    materials.forEach(material => {
      console.log(`\n📦 Материал #${material.id}:`);
      console.log(`  📝 Тип: ${material.type_key}`);
      console.log(`  📋 Содержимое: ${material.contents}`);
      console.log(`  📊 Статус: ${material.status}`);
      console.log(`  🔗 Заказ ID: ${material.order_id}`);
      console.log(`  🔗 Услуга ID: ${material.service_id}`);
    });

    // Предлагаем обновить details заказов материалами
    console.log('\n🔧 Обновляем details заказов с материалами...');

    for (const order of orders) {
      // Найдем материалы для этого заказа по service_id
      const orderMaterials = await Material.findAll({
        where: { service_id: order.service_id }
      });

      if (orderMaterials.length > 0) {
        const materialsData = orderMaterials.map(material => ({
          id: material.id,
          type_key: material.type_key,
          contents: material.contents,
          status: material.status,
          source: material.source,
          added_date: material.added_date
        }));

        await Order.update(
          {
            details: {
              materials: materialsData,
              updated_at: new Date()
            }
          },
          { where: { id: order.id } }
        );

        console.log(`✅ Заказ #${order.id} обновлен с ${materialsData.length} материалами`);
      }
    }

    console.log('\n✅ Проверка завершена!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

checkOrderDetails();
