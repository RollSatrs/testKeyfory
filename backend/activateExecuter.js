import { sequelize } from './database/databaseOn.js';
import { Executer } from './database/dbTables.js';

async function activateExecuter() {
  try {
    await sequelize.authenticate();
    console.log('🔗 Подключение к базе данных установлено');

    // Обновляем статус исполнителя на активный
    const [updatedRows] = await Executer.update(
      {
        status: 'active',
        last_activity: new Date()
      },
      {
        where: { telegram_id: '1165655712' }
      }
    );

    if (updatedRows > 0) {
      console.log('✅ Статус исполнителя обновлен на "active"');

      // Проверяем результат
      const executer = await Executer.findOne({
        where: { telegram_id: '1165655712' }
      });

      console.log('📋 Обновленная информация:', executer.toJSON());
    } else {
      console.log('❌ Не удалось обновить статус');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    process.exit(0);
  }
}

activateExecuter();
