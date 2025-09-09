import './database/databaseOn.js';
import { ExecuterActiveServices, ServiceExecution } from './database/dbTables.js';

async function fixActiveServicesStatus() {
  try {
    console.log('🔄 === ИСПРАВЛЕНИЕ СТАТУСА АКТИВНЫХ УСЛУГ ===');

    // Находим все записи в ExecuterActiveServices со статусом 'active'
    const activeServices = await ExecuterActiveServices.findAll({
      where: { status: 'active' }
    });

    console.log(`📊 Найдено активных записей: ${activeServices.length}`);

    let fixedCount = 0;

    for (const activeService of activeServices) {
      // Проверяем соответствующий заказ в ServiceExecution
      const execution = await ServiceExecution.findOne({
        where: {
          order_number: activeService.order_number,
          executer_id: activeService.executer_id,
          service_id: activeService.service_id
        }
      });

      if (execution && execution.status === 'cancelled') {
        // Заказ отменен, но активная услуга не обновлена
        await activeService.update({
          status: 'cancelled',
          updated_at: new Date()
        });

        console.log(`✅ Обновлена запись ${activeService.id}: заказ ${activeService.order_number} отменен`);
        fixedCount++;
      } else if (execution) {
        console.log(`ℹ️ Запись ${activeService.id}: заказ ${activeService.order_number} имеет статус '${execution.status}' - оставляем как есть`);
      } else {
        console.log(`⚠️ Запись ${activeService.id}: заказ ${activeService.order_number} не найден в ServiceExecution`);
      }
    }

    console.log(`\n📊 === РЕЗУЛЬТАТ ===`);
    console.log(`Исправлено записей: ${fixedCount}`);

    // Проверяем результат
    const updatedActiveServices = await ExecuterActiveServices.findAll({
      where: {
        executer_id: 48,
        status: 'active'
      }
    });

    console.log(`\n🎯 Активных записей для исполнителя 48: ${updatedActiveServices.length}`);

    updatedActiveServices.forEach((record, index) => {
      console.log(`  ${index + 1}. Заказ: ${record.order_number}, Услуга: ${record.service_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixActiveServicesStatus();
