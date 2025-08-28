import { Material } from './database/dbTables.js';

async function resetMaterials() {
  try {
    console.log('🔄 Сбрасываем состояние материалов...');

    // Очищаем order_number у всех материалов службы 145
    const result = await Material.update(
      {
        order_number: null,
        executer_id: null,
        executer_name: null,
        used_date: null,
        status: 'available'
      },
      {
        where: { service_id: 145 }
      }
    );

    console.log(`✅ Обновлено ${result[0]} материалов`);

    // Проверяем результат
    const materials = await Material.findAll({
      where: { service_id: 145 },
      attributes: ['id', 'status', 'order_number', 'executer_id']
    });

    console.log('📦 Материалы после сброса:');
    materials.forEach(m => {
      console.log(`  - ID: ${m.id}, Статус: ${m.status}, Заказ: ${m.order_number}, Исполнитель: ${m.executer_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка сброса:', error);
    process.exit(1);
  }
}

resetMaterials();
