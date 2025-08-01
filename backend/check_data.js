import { ServiceExecution, Material } from './database/dbTables.js';

async function checkData() {
  try {
    console.log('=== ПРОВЕРКА ДАННЫХ ServiceExecution ===');
    const executions = await ServiceExecution.findAll({
      attributes: ['id', 'order_number', 'service_id', 'material_contents', 'status'],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    console.log('Найдено ServiceExecution записей:', executions.length);
    executions.forEach(ex => {
      console.log(`ID: ${ex.id}, Order: ${ex.order_number}, Service: ${ex.service_id}, Status: ${ex.status}`);
    });

    console.log('\n=== ПРОВЕРКА ДАННЫХ Material для услуги 64 ===');
    const materials = await Material.findAll({
      where: { service_id: 64 },
      attributes: ['id', 'service_id', 'contents', 'status'],
      limit: 10
    });
    console.log('Найдено материалов для услуги 64:', materials.length);
    materials.forEach(m => {
      console.log(`ID: ${m.id}, Service: ${m.service_id}, Status: ${m.status}, Content: ${m.contents.substring(0, 30)}...`);
    });

    console.log('\n=== ПРОВЕРКА ВСЕХ Material ===');
    const allMaterials = await Material.findAll({
      attributes: ['id', 'service_id', 'contents', 'status'],
      limit: 5
    });
    console.log('Найдено всего материалов:', allMaterials.length);
    allMaterials.forEach(m => {
      console.log(`ID: ${m.id}, Service: ${m.service_id}, Status: ${m.status}`);
    });

  } catch (error) {
    console.error('Ошибка:', error);
  }
  process.exit(0);
}

checkData();
