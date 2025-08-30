import { Material, MaterialReplacement } from './database/dbTables.js';

async function findAllReplacedMaterials() {
  console.log('\n🔍 === ПОИСК ВСЕХ ЗАМЕНЕННЫХ МАТЕРИАЛОВ ===\n');

  // 1. Найдем все замены в системе
  const allReplacements = await MaterialReplacement.findAll({
    order: [['created_at', 'DESC']],
    limit: 20
  });

  console.log(`🔄 Всего замен в системе: ${allReplacements.length}`);

  if (allReplacements.length > 0) {
    console.log('\n📋 ДЕТАЛИ ВСЕХ ЗАМЕН:');

    for (let i = 0; i < allReplacements.length; i++) {
      const replacement = allReplacements[i];
      console.log(`\n${i + 1}. Замена ID: ${replacement.id}`);
      console.log(`   Материал ID: ${replacement.material_id || 'НЕТ'}`);
      console.log(`   Статус замены: "${replacement.status}"`);
      console.log(`   Причина: "${replacement.reason}"`);
      console.log(`   Создано: ${replacement.created_at}`);
      console.log(`   Обновлено: ${replacement.updated_at}`);

      // Если есть material_id, проверим материал
      if (replacement.material_id) {
        const material = await Material.findByPk(replacement.material_id);
        if (material) {
          console.log(`   📦 МАТЕРИАЛ:`);
          console.log(`      Содержимое: "${material.contents}"`);
          console.log(`      Статус в БД: "${material.status}"`);
          console.log(`      Заказ: ${material.order_number || 'нет'}`);
          console.log(`      Исполнитель: ${material.executer_id || 'нет'}`);

          if (replacement.status === 'completed') {
            console.log(`      🎯 ДОЛЖЕН ПОКАЗЫВАТЬСЯ В ТАБЛИЦЕ КАК: "Заменен"`);
            console.log(`      ❌ СЕЙЧАС ПОКАЗЫВАЕТСЯ КАК: "${material.status}"`);

            // Проверим нашу новую логику: заменённый материал должен быть "доступен"
            if (material.status === 'доступен' && material.order_number && material.executer_id) {
              console.log(`      ✅ НОВАЯ ЛОГИКА: Материал стал "доступен" после замены!`);
              console.log(`      🔧 ПРОБЛЕМА: В таблице показывается "Доступен", должен показываться "Заменен"`);
            }
          }
        } else {
          console.log(`   ❌ Материал не найден (возможно удален)`);
        }
      }
    }
  }

  // 2. Специальный поиск материалов по новой логике
  console.log('\n🔍 ПОИСК ПО НОВОЙ ЛОГИКЕ ЗАМЕН:');
  console.log('(материалы со статусом "доступен" + заказ + исполнитель = возможно заменены)');

  const possiblyReplacedMaterials = await Material.findAll({
    where: {
      status: 'доступен'
    },
    order: [['id', 'DESC']],
    limit: 10
  });

  let foundReplacedCount = 0;

  for (const material of possiblyReplacedMaterials) {
    // Проверим есть ли завершенная замена для этого материала
    const completedReplacement = await MaterialReplacement.findOne({
      where: {
        material_id: material.id,
        status: 'completed'
      }
    });

    if (completedReplacement) {
      foundReplacedCount++;
      console.log(`\n📦 НАЙДЕН ЗАМЕНЕННЫЙ МАТЕРИАЛ:`);
      console.log(`   ID: ${material.id}`);
      console.log(`   Содержимое: "${material.contents}"`);
      console.log(`   Статус в БД: "${material.status}" (после замены)`);
      console.log(`   Заказ: ${material.order_number || 'нет'}`);
      console.log(`   Исполнитель: ${material.executer_id || 'нет'}`);
      console.log(`   🔧 ПРОБЛЕМА: В таблице показывается "Доступен"`);
      console.log(`   ✅ ДОЛЖЕН показываться: "Заменен"`);
      console.log(`   🔄 Замена ID: ${completedReplacement.id}`);
    }
  }

  if (foundReplacedCount === 0) {
    console.log('❌ Замененных материалов по новой логике не найдено');
  } else {
    console.log(`\n📊 ИТОГО найдено замененных материалов: ${foundReplacedCount}`);
  }

  process.exit(0);
}

findAllReplacedMaterials();
