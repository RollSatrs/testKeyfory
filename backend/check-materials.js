import { Material } from './database/dbTables.js';

async function checkMaterialStatuses() {
  try {
    console.log('🔍 Проверяем статусы материалов в базе данных...');

    const materials = await Material.findAll({
      limit: 10,
      order: [['id', 'DESC']]
    });

    console.log('\n📊 Последние 10 материалов:');
    materials.forEach(mat => {
      console.log(`ID: ${mat.id}, Status: '${mat.status}', Used: ${mat.used_date}, Replacement: ${mat.replacement_requested_date}`);
    });

    console.log('\n📈 Статистика статусов:');
    const statusCounts = await Material.findAll({
      attributes: [
        'status',
        [Material.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    statusCounts.forEach(stat => {
      console.log(`Status: '${stat.status}' - Count: ${stat.getDataValue('count')}`);
    });

    console.log('\n🎯 Материалы со статусом replaced:');
    const replacedMaterials = await Material.findAll({
      where: { status: 'replaced' },
      limit: 5
    });

    replacedMaterials.forEach(mat => {
      console.log(`ID: ${mat.id}, Status: '${mat.status}', Used: ${mat.used_date}, Replacement: ${mat.replacement_requested_date}`);
    });

    console.log('\n🎯 Материалы со статусом заменен:');
    const zamenenMaterials = await Material.findAll({
      where: { status: 'заменен' },
      limit: 5
    });

    zamenenMaterials.forEach(mat => {
      console.log(`ID: ${mat.id}, Status: '${mat.status}', Used: ${mat.used_date}, Replacement: ${mat.replacement_requested_date}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkMaterialStatuses();
