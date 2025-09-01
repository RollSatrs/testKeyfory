import { sequelize } from '../database/databaseOn.js';

async function addActiveServicesTracking() {
  try {
    console.log('🔄 Добавление системы отслеживания активных услуг...');

    // Создаем таблицу для отслеживания активных услуг исполнителей
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS executer_active_services (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER REFERENCES executers(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
        order_number VARCHAR(255) NOT NULL,
        activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(executer_id, order_number)
      )
    `);
    console.log('✅ Создана таблица executer_active_services');

    // Создаем индексы для быстрого поиска
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_active_services_executer
      ON executer_active_services(executer_id)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_executer_active_services_status
      ON executer_active_services(executer_id, status)
    `);
    console.log('✅ Созданы индексы для активных услуг');

    // Добавляем поле для лимита активных услуг в таблицу исполнителей
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'executers' AND column_name = 'active_services_limit'
    `);

    if (columns.length === 0) {
      await sequelize.query(`
        ALTER TABLE executers
        ADD COLUMN active_services_limit INTEGER DEFAULT NULL
      `);
      console.log('✅ Добавлено поле active_services_limit в таблицу executers');
    } else {
      console.log('ℹ️ Поле active_services_limit уже существует');
    }

    // Создаем таблицу для настройки системы одобрений
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(255) UNIQUE NOT NULL,
        config_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Создана таблица system_config');

    // Добавляем настройку для системы одобрений
    await sequelize.query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES (
        'executer_limit_approval_mode',
        'manual',
        'Режим одобрения лимитов: manual (админ указывает новый лимит) или auto_increment (прибавляется к текущему)'
      )
      ON CONFLICT (config_key) DO NOTHING
    `);
    console.log('✅ Добавлена настройка системы одобрений');

    console.log('🎉 Система отслеживания активных услуг успешно добавлена!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении системы активных услуг:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Запускаем скрипт, если он вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  addActiveServicesTracking()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

export { addActiveServicesTracking };
