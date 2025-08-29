import { Material } from './database/dbTables.js';
import { MATERIAL_STATUS } from './constants/statusConstants.js';

console.log('🔄 Миграция статусов материалов на русский язык...\n');

async function migrateMaterialStatuses() {
  try {
    console.log('📊 До миграции:');
    const beforeStats = {
      total: await Material.count(),
      available: await Material.count({ where: { status: 'available' }}),
      used: await Material.count({ where: { status: 'used' }}),
      replaced: await Material.count({ where: { status: 'replaced' }}),
      russianAvailable: await Material.count({ where: { status: MATERIAL_STATUS.AVAILABLE }}),
      russianUsed: await Material.count({ where: { status: MATERIAL_STATUS.USED }}),
      russianReplaced: await Material.count({ where: { status: MATERIAL_STATUS.REPLACED }})
    };

    console.log('Английские статусы:');
    console.log('  available:', beforeStats.available);
    console.log('  used:', beforeStats.used);
    console.log('  replaced:', beforeStats.replaced);
    console.log('Русские статусы:');
    console.log('  доступен:', beforeStats.russianAvailable);
    console.log('  использован:', beforeStats.russianUsed);
    console.log('  заменен:', beforeStats.russianReplaced);

    // Миграция available -> доступен
    const availableUpdated = await Material.update(
      { status: MATERIAL_STATUS.AVAILABLE },
      { where: { status: 'available' }}
    );
    console.log(`\n✅ Обновлено "available" -> "доступен": ${availableUpdated[0]} записей`);

    // Миграция used -> использован
    const usedUpdated = await Material.update(
      { status: MATERIAL_STATUS.USED },
      { where: { status: 'used' }}
    );
    console.log(`✅ Обновлено "used" -> "использован": ${usedUpdated[0]} записей`);

    // Миграция replaced -> заменен
    const replacedUpdated = await Material.update(
      { status: MATERIAL_STATUS.REPLACED },
      { where: { status: 'replaced' }}
    );
    console.log(`✅ Обновлено "replaced" -> "заменен": ${replacedUpdated[0]} записей`);

    console.log('\n📊 После миграции:');
    const afterStats = {
      total: await Material.count(),
      oldAvailable: await Material.count({ where: { status: 'available' }}),
      oldUsed: await Material.count({ where: { status: 'used' }}),
      oldReplaced: await Material.count({ where: { status: 'replaced' }}),
      russianAvailable: await Material.count({ where: { status: MATERIAL_STATUS.AVAILABLE }}),
      russianUsed: await Material.count({ where: { status: MATERIAL_STATUS.USED }}),
      russianReplaced: await Material.count({ where: { status: MATERIAL_STATUS.REPLACED }})
    };

    console.log('Оставшиеся английские статусы:');
    console.log('  available:', afterStats.oldAvailable);
    console.log('  used:', afterStats.oldUsed);
    console.log('  replaced:', afterStats.oldReplaced);
    console.log('Русские статусы:');
    console.log('  доступен:', afterStats.russianAvailable);
    console.log('  использован:', afterStats.russianUsed);
    console.log('  заменен:', afterStats.russianReplaced);

    // Проверим несколько примеров после миграции
    const samples = await Material.findAll({
      limit: 5,
      attributes: ['id', 'status', 'contents'],
      order: [['id', 'ASC']]
    });

    console.log('\n📝 Примеры материалов после миграции:');
    samples.forEach(material => {
      console.log(`   ID ${material.id}: "${material.status}" - ${material.contents || 'нет содержимого'}`);
    });

    const totalMigrated = availableUpdated[0] + usedUpdated[0] + replacedUpdated[0];
    console.log(`\n🎉 Миграция завершена успешно! Обновлено ${totalMigrated} записей.`);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

migrateMaterialStatuses();
