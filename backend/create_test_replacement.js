import { Material, MaterialReplacement, ServiceExecution, Executer } from './database/dbTables.js';

async function createTestReplacement() {
  console.log('\n🔧 === СОЗДАНИЕ ТЕСТОВОЙ ЗАМЕНЫ ===\n');

  try {
    // 1. Найдем материал со статусом "использован" для тестирования
    const usedMaterial = await Material.findOne({
      where: { status: 'использован' }
    });

    if (!usedMaterial) {
      console.log('❌ Материал со статусом "использован" не найден');
      return;
    }

    console.log(`📦 Найден материал для тестирования:`);
    console.log(`   ID: ${usedMaterial.id}`);
    console.log(`   Содержимое: "${usedMaterial.contents}"`);
    console.log(`   Статус: "${usedMaterial.status}"`);
    console.log(`   Заказ: ${usedMaterial.order_number}`);
    console.log(`   Исполнитель: ${usedMaterial.executer_id}`);

    // 2. Найдем доступный материал той же услуги для замены
    const availableMaterial = await Material.findOne({
      where: {
        status: 'доступен',
        service_id: usedMaterial.service_id,
        order_number: null
      }
    });

    if (!availableMaterial) {
      console.log('❌ Доступный материал для замены не найден');
      return;
    }

    console.log(`\n📦 Найден материал для замены:`);
    console.log(`   ID: ${availableMaterial.id}`);
    console.log(`   Содержимое: "${availableMaterial.contents}"`);
    console.log(`   Статус: "${availableMaterial.status}"`);

    // 3. Найдем или создадим выполнение заказа
    let execution = await ServiceExecution.findOne({
      where: {
        order_number: usedMaterial.order_number,
        executer_id: usedMaterial.executer_id
      }
    });

    if (!execution) {
      console.log('\n🔄 Создаем выполнение заказа...');
      execution = await ServiceExecution.create({
        service_id: usedMaterial.service_id,
        executer_id: usedMaterial.executer_id,
        order_number: usedMaterial.order_number,
        status: 'in_progress',
        created_at: new Date()
      });
      console.log(`✅ Создано выполнение ID: ${execution.id}`);
    } else {
      console.log(`\n✅ Найдено выполнение заказа ID: ${execution.id}`);
    }

    // 4. Создаем запрос на замену
    console.log('\n🔄 Создаем запрос на замену...');
    const replacement = await MaterialReplacement.create({
      service_execution_id: execution.id,
      executer_id: usedMaterial.executer_id,
      material_id: usedMaterial.id,
      reason: 'ТЕСТ: Воспроизведение проблемы с отображением статуса',
      status: 'pending',
      created_at: new Date()
    });

    console.log(`✅ Создан запрос на замену ID: ${replacement.id}`);

    // 5. Выполняем замену
    console.log('\n🔄 Выполняем замену материала...');

    const { processReplacementWithNewMaterial } = await import('./api/service/ServiceAdmim/adminService.js');

    await processReplacementWithNewMaterial(
      replacement.id,
      availableMaterial.id,
      'ТЕСТ: Проверка отображения статуса после замены'
    );

    console.log('✅ Замена выполнена!');

    // 6. Проверяем результат
    console.log('\n📊 РЕЗУЛЬТАТ ЗАМЕНЫ:');

    const updatedOldMaterial = await Material.findByPk(usedMaterial.id);
    const updatedNewMaterial = await Material.findByPk(availableMaterial.id);
    const updatedReplacement = await MaterialReplacement.findByPk(replacement.id);

    console.log(`\n📦 СТАРЫЙ материал (ID: ${usedMaterial.id}):`);
    console.log(`   Статус ДО замены: "${usedMaterial.status}"`);
    console.log(`   Статус ПОСЛЕ замены: "${updatedOldMaterial.status}"`);
    console.log(`   Заказ: ${updatedOldMaterial.order_number}`);
    console.log(`   Исполнитель: ${updatedOldMaterial.executer_id}`);

    console.log(`\n📦 НОВЫЙ материал (ID: ${availableMaterial.id}):`);
    console.log(`   Статус ДО замены: "${availableMaterial.status}"`);
    console.log(`   Статус ПОСЛЕ замены: "${updatedNewMaterial.status}"`);
    console.log(`   Заказ: ${updatedNewMaterial.order_number}`);
    console.log(`   Исполнитель: ${updatedNewMaterial.executer_id}`);

    console.log(`\n🔄 Статус замены: "${updatedReplacement.status}"`);

    // 7. Анализ проблемы
    console.log(`\n🔍 АНАЛИЗ ПРОБЛЕМЫ С ТАБЛИЦЕЙ:`);
    if (updatedReplacement.status === 'completed' && updatedOldMaterial.status === 'доступен') {
      console.log(`✅ Замена прошла успешно по новой логике:`);
      console.log(`   - Старый материал стал "доступен" (можно переиспользовать)`);
      console.log(`   - В БД замена помечена как "completed"`);
      console.log(`❌ ПРОБЛЕМА В FRONTEND ТАБЛИЦЕ:`);
      console.log(`   - Таблица показывает статус "${updatedOldMaterial.status}" (из БД)`);
      console.log(`   - НО должна показывать "Заменен" (проверив completed replacement)`);
      console.log(`\n💡 НУЖНО ИСПРАВИТЬ В FRONTEND:`);
      console.log(`   Материал ID ${usedMaterial.id} должен показываться как "Заменен"`);
    }

  } catch (error) {
    console.error('❌ Ошибка создания тестовой замены:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

createTestReplacement();
