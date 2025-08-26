import { ExecuterEarnings } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

async function clearTestEarningsData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Удаляем все записи из таблицы ExecuterEarnings
    const deletedCount = await ExecuterEarnings.destroy({
      where: {}, // Пустое условие = удалить все записи
      truncate: true // Эффективнее для очистки всей таблицы
    });

    console.log(`🗑️ Удалено ${deletedCount} записей из таблицы ExecuterEarnings`);
    console.log('✅ Таблица ExecuterEarnings очищена от тестовых данных');

  } catch (error) {
    console.error('❌ Ошибка очистки тестовых данных:', error);
  } finally {
    process.exit(0);
  }
}

// Запуск скрипта
clearTestEarningsData();
