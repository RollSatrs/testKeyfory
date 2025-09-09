/**
 * 🗑️ СКРИПТ ПОЛНОЙ ОЧИСТКИ ДАННЫХ
 *
 * Очищает все данные кроме админских аккаунтов:
 * - Исполнители (Executers)
 * - Услуги (Services)
 * - Заказы (ServiceExecution)
 * - Материалы (Materials)
 * - Заработки (ExecuterEarnings)
 * - Доступы к услугам (ServiceAccess)
 * - Статусы услуг (ExecuterServiceStatus)
 * - Индивидуальные цены (ExecuterPricing)
 * - Лимиты исполнителей (ExecuterLimits)
 * - Запросы на одобрение лимитов (LimitApprovalRequests)
 *
 * СОХРАНЯЕТ: Только админские аккаунты (Admin)
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

const clearAllData = async () => {
  console.log('\n🗑️ === НАЧИНАЕМ ПОЛНУЮ ОЧИСТКУ ДАННЫХ ===\n');

  const t = await sequelize.transaction();

  try {
    // 1. Подсчет текущих данных
    console.log('📊 === ТЕКУЩЕЕ СОСТОЯНИЕ БД ===');
    const adminCount = await Admin.count({ transaction: t });
    const executerCount = await Executer.count({ transaction: t });
    const servicesCount = await Services.count({ transaction: t });
    const executionsCount = await ServiceExecution.count({ transaction: t });
    const materialsCount = await Material.count({ transaction: t });
    const earningsCount = await ExecuterEarnings.count({ transaction: t });
    const accessCount = await ServiceAccess.count({ transaction: t });
    const statusCount = await ExecuterServiceStatus.count({ transaction: t });
    const pricingCount = await ExecuterPricing.count({ transaction: t });
    const limitsCount = await ExecuterLimits.count({ transaction: t });
    const approvalCount = await LimitApprovalRequest.count({ transaction: t });
    const ordersCount = await Order.count({ transaction: t });

    console.log(`👑 Админы: ${adminCount} (СОХРАНЯТСЯ)`);
    console.log(`👤 Исполнители: ${executerCount} (УДАЛЯТСЯ)`);
    console.log(`🛠️ Услуги: ${servicesCount} (УДАЛЯТСЯ)`);
    console.log(`📋 Выполнения заказов: ${executionsCount} (УДАЛЯТСЯ)`);
    console.log(`📦 Материалы: ${materialsCount} (УДАЛЯТСЯ)`);
    console.log(`💰 Заработки: ${earningsCount} (УДАЛЯТСЯ)`);
    console.log(`🔑 Доступы к услугам: ${accessCount} (УДАЛЯТСЯ)`);
    console.log(`📊 Статусы услуг: ${statusCount} (УДАЛЯТСЯ)`);
    console.log(`💵 Индивидуальные цены: ${pricingCount} (УДАЛЯТСЯ)`);
    console.log(`⚖️ Лимиты исполнителей: ${limitsCount} (УДАЛЯТСЯ)`);
    console.log(`📝 Запросы на лимиты: ${approvalCount} (УДАЛЯТСЯ)`);
    console.log(`📋 Заказы: ${ordersCount} (УДАЛЯТСЯ)`);

    console.log('\n🗑️ === НАЧИНАЕМ УДАЛЕНИЕ ===\n');

    // 2. Удаляем данные в правильном порядке (учитывая foreign keys)

    // Сначала удаляем зависимые таблицы
    console.log('🗑️ Удаляем заработки исполнителей...');
    const deletedEarnings = await ExecuterEarnings.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено записей заработков: ${deletedEarnings}`);

    console.log('🗑️ Удаляем выполнения заказов...');
    const deletedExecutions = await ServiceExecution.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено выполнений заказов: ${deletedExecutions}`);

    console.log('🗑️ Удаляем заказы...');
    const deletedOrders = await Order.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено заказов: ${deletedOrders}`);

    console.log('🗑️ Удаляем запросы на одобрение лимитов...');
    const deletedApprovals = await LimitApprovalRequest.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено запросов на лимиты: ${deletedApprovals}`);

    console.log('🗑️ Удаляем лимиты исполнителей...');
    const deletedLimits = await ExecuterLimits.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено лимитов: ${deletedLimits}`);

    console.log('🗑️ Удаляем индивидуальные цены...');
    const deletedPricing = await ExecuterPricing.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено индивидуальных цен: ${deletedPricing}`);

    console.log('🗑️ Удаляем статусы услуг исполнителей...');
    const deletedStatuses = await ExecuterServiceStatus.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено статусов услуг: ${deletedStatuses}`);

    console.log('🗑️ Удаляем доступы к услугам...');
    const deletedAccess = await ServiceAccess.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено доступов к услугам: ${deletedAccess}`);

    console.log('🗑️ Удаляем материалы...');
    const deletedMaterials = await Material.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено материалов: ${deletedMaterials}`);

    console.log('🗑️ Удаляем услуги...');
    const deletedServices = await Services.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено услуг: ${deletedServices}`);

    console.log('🗑️ Удаляем исполнителей...');
    const deletedExecuters = await Executer.destroy({
      where: {},
      transaction: t
    });
    console.log(`✅ Удалено исполнителей: ${deletedExecuters}`);

    // 3. Проверяем что админы остались
    const remainingAdmins = await Admin.count({ transaction: t });
    console.log(`\n👑 Админов осталось: ${remainingAdmins}`);

    if (remainingAdmins === 0) {
      console.log('⚠️ ВНИМАНИЕ: В системе не осталось админов!');
    }

    await t.commit();

    console.log('\n✅ === ОЧИСТКА ЗАВЕРШЕНА УСПЕШНО ===');
    console.log('🎯 Все данные удалены, админские аккаунты сохранены');
    console.log('📊 Система готова к новой работе\n');

    // 4. Финальная статистика
    console.log('📈 === ИТОГОВАЯ СТАТИСТИКА ===');
    console.log(`👑 Админы: ${await Admin.count()}`);
    console.log(`👤 Исполнители: ${await Executer.count()}`);
    console.log(`🛠️ Услуги: ${await Services.count()}`);
    console.log(`📋 Выполнения заказов: ${await ServiceExecution.count()}`);
    console.log(`📦 Материалы: ${await Material.count()}`);
    console.log(`💰 Заработки: ${await ExecuterEarnings.count()}`);
    console.log(`🔑 Доступы к услугам: ${await ServiceAccess.count()}`);
    console.log(`📊 Статусы услуг: ${await ExecuterServiceStatus.count()}`);
    console.log(`💵 Индивидуальные цены: ${await ExecuterPricing.count()}`);
    console.log(`⚖️ Лимиты исполнителей: ${await ExecuterLimits.count()}`);
    console.log(`📝 Запросы на лимиты: ${await LimitApprovalRequest.count()}`);
    console.log(`📋 Заказы: ${await Order.count()}`);

  } catch (error) {
    await t.rollback();
    console.error('\n❌ === ОШИБКА ПРИ ОЧИСТКЕ ===');
    console.error('Детали ошибки:', error.message);
    console.error('\n🔄 Все изменения отменены (rollback)');
    throw error;
  }
};

// Запуск скрипта
clearAllData()
  .then(() => {
    console.log('🎉 Скрипт очистки выполнен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
