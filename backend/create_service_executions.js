import { sequelize } from './database/databaseOn.js';

async function createServiceExecutionsTable() {
  try {
    console.log('🔄 Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Проверяем существует ли таблица
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'service_executions'
      );
    `);

    if (results[0].exists) {
      console.log('⚠️ Таблица service_executions уже существует');
    } else {
      console.log('🔄 Создание таблицы service_executions...');

      // Создаем таблицу
      await sequelize.query(`
        CREATE TABLE service_executions (
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

      // Создаем индексы
      await sequelize.query(`CREATE INDEX idx_service_executions_service ON service_executions(service_id);`);
      await sequelize.query(`CREATE INDEX idx_service_executions_executer ON service_executions(executer_id);`);
      await sequelize.query(`CREATE INDEX idx_service_executions_order_number ON service_executions(order_number);`);

      console.log('✅ Индексы созданы');
    }

    await sequelize.close();
    console.log('✅ Миграция завершена');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('Полная ошибка:', error);
    process.exit(1);
  }
}

createServiceExecutionsTable();
