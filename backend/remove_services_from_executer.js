/**
 * 🗑️ УДАЛЕНИЕ УСЛУГ У КОНКРЕТНОГО ИСПОЛНИТЕЛЯ
 */

import { sequelize } from './database/databaseOn.js';
import {
  Services,
  ServiceAccess,
  Executer,
  ServiceExecution,
  Material,
  ExecuterServiceStatus,
  ExecuterPricing,
  ExecuterActiveServices
} from './database/dbTables.js';

const removeServicesFromExecuter = async (executerId) => {
  console.log(`\n🗑️ === УДАЛЕНИЕ УСЛУГ У ИСПОЛНИТЕЛЯ ${executerId} ===\n`);

  const t = await sequelize.transaction();

  try {
    // 1. Находим исполнителя
    const executer = await Executer.findByPk(executerId, { transaction: t });
    if (!executer) {
      throw new Error(`Исполнитель с ID ${executerId} не найден`);
    }

    console.log(`👤 Исполнитель: ${executer.name} (${executer.telegram_id})`);

    // 2. Находим все услуги исполнителя
    const executerServices = await Services.findAll({
      where: { executer_id: executerId },
      transaction: t
    });

    const accessServices = await ServiceAccess.findAll({
      where: { executer_id: executerId },
      include: [{ model: Services, as: 'Service' }],
      transaction: t
    });

    console.log(`🛠️ Прямо назначенных услуг: ${executerServices.length}`);
    console.log(`🔑 Доступов к услугам: ${accessServices.length}`);

    // 3. Удаляем все связанные данные

    // Удаляем выполнения заказов
    const deletedExecutions = await ServiceExecution.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`📋 Удалено выполнений заказов: ${deletedExecutions}`);

    // Удаляем материалы
    const deletedMaterials = await Material.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`📦 Удалено материалов: ${deletedMaterials}`);

    // Удаляем статусы услуг
    const deletedStatuses = await ExecuterServiceStatus.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`📊 Удалено статусов услуг: ${deletedStatuses}`);

    // Удаляем индивидуальные цены
    const deletedPricing = await ExecuterPricing.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`💵 Удалено индивидуальных цен: ${deletedPricing}`);

    // Удаляем активные услуги
    const deletedActiveServices = await ExecuterActiveServices.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`🔄 Удалено активных услуг: ${deletedActiveServices}`);

    // Удаляем доступы к услугам
    const deletedAccess = await ServiceAccess.destroy({
      where: { executer_id: executerId },
      transaction: t
    });
    console.log(`🔑 Удалено доступов к услугам: ${deletedAccess}`);

    // Убираем executer_id из услуг (не удаляем сами услуги)
    const updatedServices = await Services.update(
      { executer_id: null },
      {
        where: { executer_id: executerId },
        transaction: t
      }
    );
    console.log(`🛠️ Обновлено услуг (убран executer_id): ${updatedServices[0]}`);

    await t.commit();

    console.log('\n✅ === УСЛУГИ УСПЕШНО УДАЛЕНЫ У ИСПОЛНИТЕЛЯ ===');
    console.log(`👤 Исполнитель ${executer.name} остался в системе`);
    console.log(`🛠️ Все услуги и связанные данные удалены`);

  } catch (error) {
    await t.rollback();
    console.error('\n❌ === ОШИБКА УДАЛЕНИЯ УСЛУГ ===');
    console.error('Детали:', error.message);
    throw error;
  }
};

// Запускаем удаление для исполнителя с ID 48
removeServicesFromExecuter(48)
  .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });
