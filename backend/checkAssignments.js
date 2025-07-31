import { Services, Executer } from './database/dbTables.js';
import { sequelize } from './database/databaseOn.js';

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Проверяем исполнителей
    const executers = await Executer.findAll({attributes: ['id', 'name', 'telegram_id', 'status']});
    console.log('\n👤 Исполнители:');
    executers.forEach(e => console.log(`  ID: ${e.id}, Имя: ${e.name}, TG: ${e.telegram_id}, Статус: ${e.status}`));

    // Проверяем услуги с назначенными исполнителями
    const services = await Services.findAll({
      where: { executer_id: { [sequelize.Op.ne]: null } },
      attributes: ['id', 'name', 'executer_id', 'status'],
      include: [{
        model: Executer,
        as: 'AssignedExecuter',
        attributes: ['id', 'name', 'telegram_id']
      }]
    });
    console.log('\n🔧 Услуги с назначенными исполнителями:');
    services.forEach(s => console.log(`  ID: ${s.id}, Название: ${s.name}, Исполнитель: ${s.executer_id} (${s.AssignedExecuter?.name}), Статус: ${s.status}`));

    // Проверяем все услуги
    const allServices = await Services.findAll({attributes: ['id', 'name', 'executer_id', 'status']});
    console.log('\n📋 Все услуги:');
    allServices.forEach(s => console.log(`  ID: ${s.id}, Название: ${s.name}, Исполнитель: ${s.executer_id}, Статус: ${s.status}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkData();
