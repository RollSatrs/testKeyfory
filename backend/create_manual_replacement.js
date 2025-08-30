import { MaterialReplacement, Material, ServiceExecution } from './database/dbTables.js';

async function createManualReplacementRecord() {
  console.log('🔧 === СОЗДАНИЕ ЗАПИСИ О РУЧНОЙ ЗАМЕНЕ ===\n');

  try {
    // Материалы
    const oldMaterial = await Material.findOne({
      where: { contents: '77777-88888-99999-00000-AAAAA' }
    });

    const newMaterial = await Material.findOne({
      where: { contents: 'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY' }
    });

    if (!oldMaterial) {
      console.log('❌ Старый материал не найден');
      return;
    }

    if (!newMaterial) {
      console.log('❌ Новый материал не найден');
      return;
    }

    console.log(`📦 СТАРЫЙ материал ID: ${oldMaterial.id}`);
    console.log(`   Содержимое: "${oldMaterial.contents}"`);
    console.log(`   Статус: "${oldMaterial.status}"`);
    console.log(`   Заказ: ${oldMaterial.order_number}`);

    console.log(`\n📦 НОВЫЙ материал ID: ${newMaterial.id}`);
    console.log(`   Содержимое: "${newMaterial.contents}"`);
    console.log(`   Статус: "${newMaterial.status}"`);
    console.log(`   Заказ: ${newMaterial.order_number}`);

    // Проверим есть ли уже замена
    const existingReplacement = await MaterialReplacement.findOne({
      where: { material_id: oldMaterial.id, status: 'completed' }
    });

    if (existingReplacement) {
      console.log('\n✅ Замена уже существует, ID:', existingReplacement.id);
      return;
    }

    // Найдем выполнение заказа
    let execution = await ServiceExecution.findOne({
      where: {
        order_number: oldMaterial.order_number,
        executer_id: oldMaterial.executer_id
      }
    });

    if (!execution && oldMaterial.order_number && oldMaterial.executer_id) {
      console.log('\n🔄 Создаем выполнение заказа...');
      execution = await ServiceExecution.create({
        service_id: oldMaterial.service_id || newMaterial.service_id,
        executer_id: oldMaterial.executer_id,
        order_number: oldMaterial.order_number,
        status: 'completed', // Заказ выполнен, так как уже была замена
        created_at: new Date()
      });
      console.log(`✅ Создано выполнение ID: ${execution.id}`);
    }

    // Создаем запись о замене
    console.log('\n🔄 Создаем запись о замене...');
    const replacement = await MaterialReplacement.create({
      service_execution_id: execution?.id,
      executer_id: oldMaterial.executer_id,
      material_id: oldMaterial.id,
      reason: 'РУЧНАЯ ЗАМЕНА: Создана запись для корректного отображения в таблице',
      status: 'completed', // Сразу завершенная
      admin_comment: 'Замена была выполнена вручную, создается запись для frontend',
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`✅ Создана запись о замене ID: ${replacement.id}`);

    console.log('\n📊 РЕЗУЛЬТАТ:');
    console.log(`✅ Теперь материал "${oldMaterial.contents}" будет показываться как "Заменен"`);
    console.log(`✅ В tooltip будет объяснение о замене`);
    console.log(`✅ Статус в БД остается "${oldMaterial.status}" для корректной работы системы`);

  } catch (error) {
    console.error('❌ Ошибка создания записи о замене:', error.message);
  }

  process.exit(0);
}

createManualReplacementRecord();
