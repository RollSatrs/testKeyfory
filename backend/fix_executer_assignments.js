/**
 * 🔧 СКРИПТ ДЛЯ РУЧНОГО ИСПРАВЛЕНИЯ ПРОБЛЕМЫ
 */

import { sequelize, Executer, Services, ServiceAccess, ServiceExecution, ExecuterServiceStatus } from './database/dbTables.js';

const fixExecuterServiceAssignments = async () => {
  console.log('\n🔧 === ИСПРАВЛЕНИЕ НАЗНАЧЕНИЙ УСЛУГ ===\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно');

    // Находим исполнителя 48 (Rollan)
    const executer = await Executer.findByPk(48);
    console.log(`\n👤 Исполнитель: ${executer.name} (ID: ${executer.id})`);

    // Проверяем текущие активные заказы
    const activeExecutions = await ServiceExecution.findAll({
      where: {
        executer_id: 48,
        status: {
          [sequelize.Sequelize.Op.in]: ['pending', 'in_progress', 'active']
        }
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name']
      }]
    });

    console.log(`\n⚡ Активные заказы исполнителя 48: ${activeExecutions.length}`);
    const activeServiceIds = [];
    activeExecutions.forEach((exec, index) => {
      console.log(`  ${index + 1}. Заказ ${exec.order_number}: услуга ${exec.service_id} "${exec.Service?.name}"`);
      if (!activeServiceIds.includes(exec.service_id)) {
        activeServiceIds.push(exec.service_id);
      }
    });

    console.log(`\n🎯 Услуги с активными заказами: [${activeServiceIds.join(', ')}]`);

    // Проверяем все услуги, назначенные исполнителю напрямую
    const directlyAssignedServices = await Services.findAll({
      where: { executer_id: 48 },
      attributes: ['id', 'name', 'executer_id']
    });

    console.log(`\n🔗 Услуги с прямым назначением: ${directlyAssignedServices.length}`);
    directlyAssignedServices.forEach((service, index) => {
      const hasActiveOrder = activeServiceIds.includes(service.id);
      console.log(`  ${index + 1}. ID: ${service.id}, "${service.name}" - активные заказы: ${hasActiveOrder ? '✅' : '❌'}`);
    });

    // Исправляем: убираем прямое назначение с услуг, которые НЕ имеют активных заказов
    const servicesToUnassign = directlyAssignedServices.filter(service =>
      !activeServiceIds.includes(service.id)
    );

    if (servicesToUnassign.length > 0) {
      console.log(`\n🔧 Исправляем назначения для ${servicesToUnassign.length} услуг без активных заказов:`);

      for (const service of servicesToUnassign) {
        console.log(`  - Убираем прямое назначение с услуги ${service.id} "${service.name}"`);

        await Services.update(
          { executer_id: null },
          { where: { id: service.id } }
        );
      }

      console.log(`✅ Исправление завершено!`);

    } else {
      console.log(`\n✅ Все назначения корректны - исправления не требуются`);
    }

    // Проверяем ServiceAccess
    const serviceAccess = await ServiceAccess.findAll({
      where: { executer_id: 48 }
    });

    console.log(`\n🔑 ServiceAccess записей: ${serviceAccess.length}`);

    // Очищаем ServiceAccess для услуг без активных заказов
    const accessToRemove = serviceAccess.filter(access =>
      !activeServiceIds.includes(access.service_id)
    );

    if (accessToRemove.length > 0) {
      console.log(`\n🧹 Очищаем ServiceAccess для ${accessToRemove.length} услуг без активных заказов:`);

      for (const access of accessToRemove) {
        console.log(`  - Удаляем доступ к услуге ${access.service_id}`);

        await ServiceAccess.destroy({
          where: {
            executer_id: 48,
            service_id: access.service_id
          }
        });
      }

      console.log(`✅ ServiceAccess очищен!`);
    }

    // Проверяем ExecuterServiceStatus
    const executerServiceStatus = await ExecuterServiceStatus.findAll({
      where: { executer_id: 48 }
    });

    console.log(`\n📊 ExecuterServiceStatus записей: ${executerServiceStatus.length}`);

    // Очищаем ExecuterServiceStatus для услуг без активных заказов
    const statusToRemove = executerServiceStatus.filter(status =>
      !activeServiceIds.includes(status.service_id)
    );

    if (statusToRemove.length > 0) {
      console.log(`\n🧹 Очищаем ExecuterServiceStatus для ${statusToRemove.length} услуг без активных заказов:`);

      for (const status of statusToRemove) {
        console.log(`  - Удаляем статус услуги ${status.service_id}`);

        await ExecuterServiceStatus.destroy({
          where: {
            executer_id: 48,
            service_id: status.service_id
          }
        });
      }

      console.log(`✅ ExecuterServiceStatus очищен!`);
    }

    console.log(`\n🎉 === ИСПРАВЛЕНИЕ ЗАВЕРШЕНО ===`);
    console.log(`\n💡 Теперь в админской панели должна показываться только 1 услуга`);
    console.log(`   (только та, по которой есть активные заказы)`);

  } catch (error) {
    console.error('❌ Ошибка исправления:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

fixExecuterServiceAssignments().catch(console.error);
