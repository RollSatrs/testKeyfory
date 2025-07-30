import { sequelize } from './databaseOn.js';

export const addServiceExecuterRelation = async () => {
  try {
    console.log('🔄 Создание связи исполнителей с услугами...');

    // Проверяем, существует ли уже таблица service_access
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'service_access'
      );
    `);

    if (results[0].exists) {
      console.log('✅ Таблица service_access уже существует');
      return;
    }

    // Создаем таблицу связи исполнителей с услугами
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS service_access (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER NOT NULL REFERENCES executers(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        has_access BOOLEAN DEFAULT true,
        can_replace_materials BOOLEAN DEFAULT false,
        requires_approval BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(executer_id, service_id)
      );
    `);

    console.log('✅ Таблица service_access создана');

    // Создаем индексы для оптимизации запросов
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_service_access_executer
      ON service_access(executer_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_service_access_service
      ON service_access(service_id);
    `);

    console.log('✅ Индексы созданы');

  } catch (error) {
    console.error('❌ Ошибка создания связи исполнителей с услугами:', error);
    throw error;
  }
};

// Запускаем миграцию
if (import.meta.url === `file://${process.argv[1]}`) {
  addServiceExecuterRelation()
    .then(() => {
      console.log('✅ Миграция связи исполнителей с услугами завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    });
}
