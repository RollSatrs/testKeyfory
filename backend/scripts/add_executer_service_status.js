import { sequelize } from '../database/databaseOn.js';

async function addExecuterServiceStatus() {
  try {
    console.log('🔄 Добавление системы индивидуальных статусов услуг для исполнителей...');

    // Создаем таблицу для отслеживания индивидуальных статусов услуг исполнителей
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS executer_service_status (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER REFERENCES executers(id) ON DELETE CASCADE NOT NULL,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE NOT NULL,
        status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
        first_order_at TIMESTAMP NULL,
        last_order_at TIMESTAMP NULL,
        total_orders INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(executer_id, service_id)
      )
    `);
    console.log('✅ Создана таблица executer_service_status');

    // Создаем индексы для быстрого поиска
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_executer_id
      ON executer_service_status(executer_id)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_service_id
      ON executer_service_status(service_id)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_status
      ON executer_service_status(executer_id, service_id, status)
    `);
    console.log('✅ Созданы индексы для индивидуальных статусов услуг');

    // Заполняем таблицу данными на основе существующих связей
    console.log('📊 Заполнение таблицы существующими данными...');

    // Получаем все связи исполнитель-услуга из ServiceAccess
    await sequelize.query(`
      INSERT INTO executer_service_status (executer_id, service_id, status, created_at, updated_at)
      SELECT DISTINCT
        sa.executer_id,
        sa.service_id,
        'inactive' as status,
        sa.created_at,
        sa.created_at as updated_at
      FROM service_access sa
      WHERE sa.has_access = true
      ON CONFLICT (executer_id, service_id) DO NOTHING
    `);
    console.log('✅ Добавлены записи из service_access');

    // Обновляем статусы на 'active' для исполнителей, которые уже имеют заказы
    await sequelize.query(`
      UPDATE executer_service_status ess
      SET
        status = 'active',
        first_order_at = subq.first_order,
        last_order_at = subq.last_order,
        total_orders = subq.order_count,
        updated_at = CURRENT_TIMESTAMP
      FROM (
        SELECT
          se.executer_id,
          se.service_id,
          MIN(se.created_at) as first_order,
          MAX(se.created_at) as last_order,
          COUNT(*) as order_count
        FROM service_executions se
        GROUP BY se.executer_id, se.service_id
      ) subq
      WHERE ess.executer_id = subq.executer_id
        AND ess.service_id = subq.service_id
    `);
    console.log('✅ Обновлены статусы на основе существующих заказов');

    console.log('🎉 Система индивидуальных статусов услуг успешно добавлена!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении системы индивидуальных статусов:', error);
    throw error;
  }
}

// Запуск скрипта
addExecuterServiceStatus()
  .then(() => {
    console.log('✅ Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
