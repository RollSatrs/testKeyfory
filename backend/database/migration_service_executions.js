import { sequelize } from './databaseOn.js';

export const createServiceExecutionsTable = async () => {
  try {
    console.log('🔄 Создание таблицы service_executions...');

    // Проверяем, существует ли уже таблица
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'service_executions'
      );
    `);

    if (results[0].exists) {
      console.log('✅ Таблица service_executions уже существует');
      return;
    }

    // Создаем таблицу выполнений услуг
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS service_executions (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        executer_id INTEGER NOT NULL REFERENCES executers(id) ON DELETE CASCADE,
        order_number VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'in_progress' NOT NULL,
        materials_details JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(executer_id, order_number)
      );
    `);

    console.log('✅ Таблица service_executions создана');

    // Создаем индексы для оптимизации запросов
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_service_executions_service
      ON service_executions(service_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_service_executions_executer
      ON service_executions(executer_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_service_executions_order_number
      ON service_executions(order_number);
    `);

    console.log('✅ Индексы созданы');

  } catch (error) {
    console.error('❌ Ошибка создания таблицы service_executions:', error);
    throw error;
  }
};

// Запускаем миграцию
if (import.meta.url === `file://${process.argv[1]}`) {
  createServiceExecutionsTable()
    .then(() => {
      console.log('✅ Миграция service_executions завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    });
}
