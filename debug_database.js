// Скрипт для проверки базы данных
import { Services, Executer, ServiceAccess, ServiceExecution } from './backend/database/dbTables.js';

console.log('🔍 === ПРОВЕРКА БАЗЫ ДАННЫХ ===\n');

async function checkDatabase() {
  try {
    // 1. Проверяем исполнителей
    console.log('👤 EXECUTERS:');
    const executers = await Executer.findAll();
    console.log(`Всего исполнителей: ${executers.length}`);
    executers.forEach(exec => {
      console.log(`- ID: ${exec.id}, Name: ${exec.name}, Telegram: ${exec.telegram_id}`);
    });
    console.log('');

    // 2. Проверяем услуги
    console.log('🎯 SERVICES:');
    const services = await Services.findAll();
    console.log(`Всего услуг: ${services.length}`);
    services.forEach(service => {
      console.log(`- ID: ${service.id}, Name: ${service.name}, Price: ${service.price}`);
    });
    console.log('');

    // 3. Проверяем ServiceAccess (доступ к услугам)
    console.log('🔑 SERVICE_ACCESS:');
    const serviceAccess = await ServiceAccess.findAll();
    console.log(`Всего записей доступа: ${serviceAccess.length}`);
    serviceAccess.forEach(access => {
      console.log(`- Executer ID: ${access.executer_id}, Service ID: ${access.service_id}`);
    });
    console.log('');

    // 4. Проверяем ServiceExecution
    console.log('📋 SERVICE_EXECUTION:');
    const executions = await ServiceExecution.findAll();
    console.log(`Всего выполнений: ${executions.length}`);
    executions.forEach(exec => {
      console.log(`- ID: ${exec.id}, Order: ${exec.order_number}, Executer: ${exec.executer_id}, Service: ${exec.service_id}`);
    });
    console.log('');

    // 5. Проверяем связи для конкретного исполнителя (ID: 20)
    console.log('🔍 ПРОВЕРКА ДЛЯ EXECUTER ID: 20');

    // Услуги через ServiceAccess
    const accessServices = await ServiceAccess.findAll({
      where: { executer_id: 20 },
      include: [{ model: Services, as: 'Service' }]
    });
    console.log(`Услуги через ServiceAccess: ${accessServices.length}`);
    accessServices.forEach(access => {
      console.log(`- Service: ${access.Service?.name || 'Unknown'} (ID: ${access.service_id})`);
    });

    // Услуги через прямое назначение (где executer_id совпадает)
    const assignedServices = await Services.findAll({
      where: { executer_id: 20 }
    });
    console.log(`Услуги через прямое назначение: ${assignedServices.length}`);
    assignedServices.forEach(service => {
      console.log(`- Service: ${service.name} (ID: ${service.id})`);
    });

    // Объединяем уникальные услуги
    const allServiceIds = [
      ...accessServices.map(a => a.service_id),
      ...assignedServices.map(s => s.id)
    ];
    const uniqueServiceIds = [...new Set(allServiceIds)];
    console.log(`Итого уникальных услуг для исполнителя 20: ${uniqueServiceIds.length}`);

  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error);
  }

  process.exit(0);
}

checkDatabase();
