import { Services } from './database/dbTables.js';

async function checkServices() {
  try {
    const services = await Services.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'name', 'replacement_type'],
      limit: 10
    });

    console.log('📋 Услуги и их типы замены:');
    services.forEach(service => {
      console.log(`ID: ${service.id}, Название: ${service.name}, Тип замены: ${service.replacement_type}`);
    });

    console.log('\n🔄 Изменяем тип замены для услуги Brawl Pass (ID 168) на auto...');
    await Services.update(
      { replacement_type: 'auto' },
      { where: { id: 168 } }
    );

    const updatedService = await Services.findByPk(168, { attributes: ['id', 'name', 'replacement_type'] });
    console.log(`✅ Обновлено: ${updatedService.name} - ${updatedService.replacement_type}`);

    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkServices();
