import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'testKeyfory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/"/g, '') : '',
});

async function addExecuterServiceStatusTable() {
  try {
    await client.connect();
    console.log('🔌 Подключено к базе данных');

    // Создаем таблицу ExecuterServiceStatus
    await client.query(`
      CREATE TABLE IF NOT EXISTS executer_service_status (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER NOT NULL REFERENCES executers(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'completed')),
        total_orders INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(executer_id, service_id)
      );
    `);

    console.log('✅ Таблица executer_service_status создана');

    // Создаем индексы для оптимизации
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_executer
      ON executer_service_status(executer_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_service
      ON executer_service_status(service_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_service_status_status
      ON executer_service_status(status);
    `);

    console.log('✅ Индексы созданы');

    // Создаем триггер для обновления updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_executer_service_status_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_executer_service_status_updated_at_trigger
      ON executer_service_status;
    `);

    await client.query(`
      CREATE TRIGGER update_executer_service_status_updated_at_trigger
        BEFORE UPDATE ON executer_service_status
        FOR EACH ROW EXECUTE FUNCTION update_executer_service_status_updated_at();
    `);

    console.log('✅ Триггер для updated_at создан');

    console.log('🎉 Миграция ExecuterServiceStatus завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы ExecuterServiceStatus:', error);
  } finally {
    await client.end();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

addExecuterServiceStatusTable();
