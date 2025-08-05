import { Services, ServiceExecution, Material } from './database/dbTables.js';
import { Op } from 'sequelize';

async function cleanupOldExecutions() {
  try {
    console.log('🧹 === ОЧИСТКА УСТАРЕВШИХ ЗАКАЗОВ ===');

    // 1. Найти все заказы с удаленными или неактивными услугами
    const executionsToDelete = await ServiceExecution.findAll({
      include: [{
        model: Services,
        as: 'Service',
        where: {
          [Op.or]: [
            { status: { [Op.ne]: 'active' } }, // Неактивные услуги
            { id: null } // Услуга была удалена
          ]
        },
        required: false // LEFT JOIN чтобы найти записи с удаленными услугами
      }]
    });

    console.log(`🔍 Найдено заказов для очистки: ${executionsToDelete.length}`);

    if (executionsToDelete.length === 0) {
      console.log('✅ Нет устаревших заказов для очистки');
      return;
    }

    // 2. Получить order_number для освобождения материалов
    const orderNumbers = executionsToDelete.map(exec => exec.order_number).filter(Boolean);

    console.log(`📋 Order numbers для освобождения материалов:`, orderNumbers);

    // 3. Освобождаем материалы - удаляем order_number и executer_id
    if (orderNumbers.length > 0) {
      const materialsUpdated = await Material.update(
        {
          order_number: null,
          executer_id: null,
          status: 'доступен'
        },
        {
          where: {
            order_number: {
              [Op.in]: orderNumbers
            }
          }
        }
      );

      console.log(`📦 Освобождено материалов: ${materialsUpdated[0]}`);
    }

    // 4. Удаляем устаревшие заказы
    const executionIds = executionsToDelete.map(exec => exec.id);

    const deletedCount = await ServiceExecution.destroy({
      where: {
        id: {
          [Op.in]: executionIds
        }
      }
    });

    console.log(`🗑️ Удалено устаревших заказов: ${deletedCount}`);
    console.log('✅ Очистка завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
  }
}

// Запускаем очистку
cleanupOldExecutions().then(() => {
  console.log('🏁 Скрипт очистки завершен');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
