import { ExecuterLimits } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

async function migrateExecuterLimitsToGeneralLimits() {
  try {
    console.log('🔄 Начинаю миграцию лимитов исполнителей...');

    // Отключаем проверки внешних ключей временно
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true }).catch(() => {
      console.log('Note: FOREIGN_KEY_CHECKS не поддерживается в PostgreSQL');
    });

    // Для PostgreSQL используем другой подход
    await sequelize.query('ALTER TABLE executer_limits DROP CONSTRAINT IF EXISTS "executer_limits_service_id_fkey"');

    // Очищаем существующие записи с некорректными service_id
    const deletedCount = await ExecuterLimits.destroy({
      where: {
        service_id: {
          [sequelize.Op.or]: [null, 0, '']
        }
      },
      force: true
    });
    console.log(`🗑️ Удалено ${deletedCount} некорректных записей лимитов`);

    // Пересоздаем ограничение с поддержкой NULL
    await sequelize.query(`
      ALTER TABLE executer_limits
      ALTER COLUMN service_id DROP NOT NULL
    `);

    // Добавляем внешний ключ без ограничения NOT NULL
    await sequelize.query(`
      ALTER TABLE executer_limits
      ADD CONSTRAINT "executer_limits_service_id_fkey"
      FOREIGN KEY (service_id)
      REFERENCES services (id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    // Создаем общие лимиты для всех исполнителей (service_id = null)
    const executers = await sequelize.query('SELECT id FROM executers', {
      type: sequelize.QueryTypes.SELECT
    });

    for (const executer of executers) {
      await ExecuterLimits.findOrCreate({
        where: {
          executer_id: executer.id,
          service_id: null // Общий лимит
        },
        defaults: {
          max_orders: 10, // По умолчанию 10 заказов
          used_orders: 0,
          is_blocked: false,
          notes: 'Общий лимит исполнителя (создан автоматически)'
        }
      });
    }

    console.log('✅ Миграция завершена успешно!');
    console.log('🎯 Все исполнители теперь имеют общие лимиты (service_id = null)');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  }
}

// Запускаем миграцию
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExecuterLimitsToGeneralLimits()
    .then(() => {
      console.log('🎉 Миграция выполнена успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ошибка выполнения миграции:', error);
      process.exit(1);
    });
}

export { migrateExecuterLimitsToGeneralLimits };
