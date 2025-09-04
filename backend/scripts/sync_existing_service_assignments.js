import { sequelize } from '../database/databaseOn.js';
import { ServiceAccess, ExecuterServiceStatus, Services, Executer, ServiceExecution } from '../database/dbTables.js';

async function syncExistingServiceAssignments() {
  try {
    console.log('🔄 Синхронизация существующих назначений услуг с системой индивидуальных статусов...');

    // Получаем все существующие назначения из ServiceAccess
    const existingAccess = await ServiceAccess.findAll({
      include: [
        {
          model: Services,
          attributes: ['id', 'name']
        },
        {
          model: Executer,
          attributes: ['id', 'name']
        }
      ]
    });

    console.log(`📊 Найдено ${existingAccess.length} существующих назначений`);

    let created = 0;
    let updated = 0;

    for (const access of existingAccess) {
      const serviceId = access.service_id;
      const executerId = access.executer_id;
      const serviceName = access.Service?.name || `ID:${serviceId}`;
      const executerName = access.Executer?.name || `ID:${executerId}`;

      console.log(`🔧 Обработка: ${executerName} -> ${serviceName}`);

      // Проверяем, есть ли уже запись в ExecuterServiceStatus
      const existingStatus = await ExecuterServiceStatus.findOne({
        where: {
          service_id: serviceId,
          executer_id: executerId
        }
      });

      if (existingStatus) {
        console.log(`  ℹ️ Статус уже существует: ${existingStatus.status}`);
        continue;
      }

      // Проверяем, есть ли у этого исполнителя заказы по этой услуге
      const hasOrders = await ServiceExecution.count({
        where: {
          service_id: serviceId,
          executer_id: executerId
        }
      });

      const status = hasOrders > 0 ? 'active' : 'inactive';

      // Получаем информацию о первом и последнем заказе, если есть
      let firstOrderAt = null;
      let lastOrderAt = null;
      let totalOrders = 0;

      if (hasOrders > 0) {
        const orderStats = await ServiceExecution.findAll({
          where: {
            service_id: serviceId,
            executer_id: executerId
          },
          attributes: ['created_at'],
          order: [['created_at', 'ASC']]
        });

        if (orderStats.length > 0) {
          firstOrderAt = orderStats[0].created_at;
          lastOrderAt = orderStats[orderStats.length - 1].created_at;
          totalOrders = orderStats.length;
        }
      }

      // Создаем запись статуса
      await ExecuterServiceStatus.create({
        service_id: serviceId,
        executer_id: executerId,
        status: status,
        first_order_at: firstOrderAt,
        last_order_at: lastOrderAt,
        total_orders: totalOrders
      });

      created++;
      console.log(`  ✅ Создан статус: ${status} (заказов: ${totalOrders})`);
    }

    console.log(`🎉 Синхронизация завершена!`);
    console.log(`📊 Создано записей: ${created}`);
    console.log(`📊 Обновлено записей: ${updated}`);

  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
    throw error;
  }
}

// Запуск скрипта
syncExistingServiceAssignments()
  .then(() => {
    console.log('✅ Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
