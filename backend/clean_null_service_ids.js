import { sequelize } from './database/databaseOn.js';
import { ExecuterLimits } from './database/dbTables.js';

async function cleanNullServiceIds() {
  try {
    console.log('🔍 Проверяем записи с NULL service_id...');

    // Подсчитываем записи с NULL
    const nullCount = await ExecuterLimits.count({
      where: {
        service_id: null
      }
    });

    console.log(`📊 Найдено записей с NULL service_id: ${nullCount}`);

    if (nullCount > 0) {
      // Удаляем записи с NULL service_id
      const deletedCount = await ExecuterLimits.destroy({
        where: {
          service_id: null
        }
      });

      console.log(`🗑️ Удалено записей с NULL service_id: ${deletedCount}`);
    } else {
      console.log('✅ Записей с NULL service_id не найдено');
    }

    console.log('✅ Очистка завершена');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
    process.exit(1);
  }
}

cleanNullServiceIds();
