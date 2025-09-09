/**
 * 🛡️ БЕЗОПАСНАЯ ОЧИСТКА ДАННЫХ С ПОДТВЕРЖДЕНИЕМ
 *
 * Этот скрипт требует явного подтверждения перед очисткой
 */

import { sequelize } from './database/databaseOn.js';
import {
  Admin,
  Executer,
  Services,
  ServiceExecution,
  Material,
  ExecuterEarnings,
  ServiceAccess,
  ExecuterServiceStatus,
  ExecuterPricing,
  ExecuterLimits,
  LimitApprovalRequest,
  Order,
  MaterialReplacement,
  ExecuterActiveServices,
  Log
} from './database/dbTables.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const safeClearAllData = async () => {
  console.log('\n🚨 === ВНИМАНИЕ: ПОЛНАЯ ОЧИСТКА ДАННЫХ ===\n');
  console.log('⚠️ Этот скрипт удалит ВСЕ данные кроме админских аккаунтов:');
  console.log('   - Всех исполнителей');
  console.log('   - Все услуги');
  console.log('   - Все заказы и их выполнения');
  console.log('   - Все материалы');
  console.log('   - Все заработки');
  console.log('   - Все доступы и настройки\n');

  console.log('✅ СОХРАНЯТСЯ: Только админские аккаунты\n');

  // Показываем текущую статистику
  console.log('📊 === ТЕКУЩИЕ ДАННЫЕ В БД ===');
  const adminCount = await Admin.count();
  const executerCount = await Executer.count();
  const servicesCount = await Services.count();
  const executionsCount = await ServiceExecution.count();
  const materialsCount = await Material.count();

  console.log(`👑 Админы: ${adminCount} (ОСТАНУТСЯ)`);
  console.log(`👤 Исполнители: ${executerCount} (УДАЛЯТСЯ)`);
  console.log(`🛠️ Услуги: ${servicesCount} (УДАЛЯТСЯ)`);
  console.log(`📋 Выполнения заказов: ${executionsCount} (УДАЛЯТСЯ)`);
  console.log(`📦 Материалы: ${materialsCount} (УДАЛЯТСЯ)\n`);

  // Первое подтверждение
  const answer1 = await askQuestion('❓ Вы действительно хотите очистить ВСЕ данные? (введите "ДА" для продолжения): ');

  if (answer1 !== 'ДА') {
    console.log('❌ Операция отменена пользователем');
    rl.close();
    return;
  }

  // Второе подтверждение
  const answer2 = await askQuestion('❓ Это действие НЕЛЬЗЯ отменить! Введите "ОЧИСТИТЬ" для подтверждения: ');

  if (answer2 !== 'ОЧИСТИТЬ') {
    console.log('❌ Операция отменена пользователем');
    rl.close();
    return;
  }

  rl.close();

  console.log('\n🗑️ === НАЧИНАЕМ ОЧИСТКУ ===\n');

  const t = await sequelize.transaction();

  try {
    // Удаляем данные в правильном порядке (учитывая foreign keys)

    console.log('🗑️ Удаляем заработки исполнителей...');
    const deletedEarnings = await ExecuterEarnings.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено записей заработков: ${deletedEarnings}`);

    console.log('🗑️ Удаляем выполнения заказов...');
    const deletedExecutions = await ServiceExecution.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено выполнений заказов: ${deletedExecutions}`);

    console.log('🗑️ Удаляем заказы...');
    const deletedOrders = await Order.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено заказов: ${deletedOrders}`);

    console.log('🗑️ Удаляем запросы на одобрение лимитов...');
    const deletedApprovals = await LimitApprovalRequest.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено запросов на лимиты: ${deletedApprovals}`);

    console.log('🗑️ Удаляем лимиты исполнителей...');
    const deletedLimits = await ExecuterLimits.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено лимитов: ${deletedLimits}`);

    console.log('🗑️ Удаляем индивидуальные цены...');
    const deletedPricing = await ExecuterPricing.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено индивидуальных цен: ${deletedPricing}`);

    console.log('🗑️ Удаляем статусы услуг исполнителей...');
    const deletedStatuses = await ExecuterServiceStatus.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено статусов услуг: ${deletedStatuses}`);

    console.log('🗑️ Удаляем доступы к услугам...');
    const deletedAccess = await ServiceAccess.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено доступов к услугам: ${deletedAccess}`);

    console.log('🗑️ Удаляем материалы...');
    const deletedMaterials = await Material.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено материалов: ${deletedMaterials}`);

    console.log('🗑️ Удаляем активные услуги исполнителей...');
    const deletedActiveServices = await ExecuterActiveServices.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено активных услуг: ${deletedActiveServices}`);

    console.log('🗑️ Удаляем замены материалов...');
    const deletedReplacements = await MaterialReplacement.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено замен материалов: ${deletedReplacements}`);

    console.log('🗑️ Удаляем логи...');
    const deletedLogs = await Log.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено логов: ${deletedLogs}`);

    console.log('🗑️ Удаляем услуги...');
    const deletedServices = await Services.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено услуг: ${deletedServices}`);

    console.log('🗑️ Удаляем исполнителей...');
    const deletedExecuters = await Executer.destroy({ where: {}, transaction: t });
    console.log(`✅ Удалено исполнителей: ${deletedExecuters}`);

    // Проверяем что админы остались
    const remainingAdmins = await Admin.count({ transaction: t });
    console.log(`\n👑 Админов осталось: ${remainingAdmins}`);

    await t.commit();

    console.log('\n🎉 === ОЧИСТКА ЗАВЕРШЕНА УСПЕШНО ===');
    console.log('✅ Все данные удалены, админские аккаунты сохранены');
    console.log('🎯 Система готова к новой работе\n');

  } catch (error) {
    await t.rollback();
    console.error('\n❌ === ОШИБКА ПРИ ОЧИСТКЕ ===');
    console.error('Детали ошибки:', error.message);
    console.error('\n🔄 Все изменения отменены (rollback)');
    throw error;
  }
};

// Запуск скрипта
safeClearAllData()
  .then(() => {
    console.log('🎉 Скрипт очистки выполнен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
