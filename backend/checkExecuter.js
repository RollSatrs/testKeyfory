import { sequelize } from './database/databaseOn.js';
import { Executer } from './database/dbTables.js';

async function checkAndAddExecuter() {
  try {
    await sequelize.authenticate();
    console.log('🔗 Подключение к базе данных установлено');

    // Проверяем существующего исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id: '1165655712' }
    });

    if (executer) {
      console.log('✅ Исполнитель найден:', executer.toJSON());
    } else {
      console.log('❌ Исполнитель с ID 1165655712 не найден в базе');

      // Показываем всех исполнителей
      const allExecuters = await Executer.findAll();
      console.log('📋 Все исполнители в базе:');
      allExecuters.forEach(exec => {
        console.log(`- ID: ${exec.id}, Telegram: ${exec.telegram_id}, Имя: ${exec.name || 'Без имени'}`);
      });

      // Добавляем нового исполнителя
      console.log('\n🔄 Добавляем нового исполнителя...');
      const newExecuter = await Executer.create({
        name: 'Rollan',
        telegram_id: '1165655712',
        rating: 0,
        status: 'active',
        balance: 0,
        access_rights: {},
        last_activity: new Date(),
        create_date_executer: new Date()
      });

      console.log('✅ Новый исполнитель добавлен:', newExecuter.toJSON());
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAndAddExecuter();
