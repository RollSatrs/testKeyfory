import { ServiceExecution, Material, Services } from './database/dbTables.js';

async function stepByStepDebug() {
  try {
    console.log('🔍 Пошаговая отладка замены материала...\n');

    const orderNumber = '12';
    const executerId = 33;

    // Шаг 1: Найти выполнение заказа
    console.log('1️⃣ Поиск выполнения заказа...');
    const execution = await ServiceExecution.findOne({
      where: { order_number: orderNumber },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name']
      }]
    });

    if (!execution) {
      console.log('❌ Выполнение заказа не найдено!');
      process.exit(1);
    }

    console.log('✅ Выполнение найдено:', {
      id: execution.id,
      service_id: execution.service_id,
      executer_id: execution.executer_id,
      order_number: execution.order_number,
      serviceName: execution.Service?.name
    });

    // Шаг 2: Найти текущий материал исполнителя
    console.log('\n2️⃣ Поиск текущего материала исполнителя...');
    const currentMaterial = await Material.findOne({
      where: {
        service_id: execution.service_id,
        executer_id: executerId,
        status: ['assigned', 'used']
      }
    });

    if (!currentMaterial) {
      console.log('❌ Текущий материал исполнителя не найден!');
      console.log('Параметры поиска:', {
        service_id: execution.service_id,
        executer_id: executerId,
        status: ['assigned', 'used']
      });
      process.exit(1);
    }

    console.log('✅ Текущий материал найден:', {
      id: currentMaterial.id,
      contents: currentMaterial.contents,
      status: currentMaterial.status,
      executer_id: currentMaterial.executer_id
    });

    // Шаг 3: Найти новый доступный материал
    console.log('\n3️⃣ Поиск нового доступного материала...');
    const newMaterial = await Material.findOne({
      where: {
        service_id: execution.service_id,
        status: 'available'
      }
    });

    if (!newMaterial) {
      console.log('❌ Доступный материал для замены не найден!');
      console.log('Параметры поиска:', {
        service_id: execution.service_id,
        status: 'available'
      });
      process.exit(1);
    }

    console.log('✅ Новый материал найден:', {
      id: newMaterial.id,
      contents: newMaterial.contents,
      status: newMaterial.status
    });

    console.log('\n🎉 Все данные для замены найдены!');
    console.log('Замена будет:', {
      старый: `${currentMaterial.contents} (ID: ${currentMaterial.id})`,
      новый: `${newMaterial.contents} (ID: ${newMaterial.id})`
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
    process.exit(1);
  }
}

stepByStepDebug();
