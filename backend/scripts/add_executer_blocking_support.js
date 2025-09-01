import { sequelize } from '../database/databaseOn.js';

async function addExecuterBlockingSupport() {
  try {
    console.log('🔄 Добавление поддержки блокировки исполнителей...');

    // Проверяем, есть ли уже колонка status в таблице executers
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'executers' AND column_name = 'status'
    `);

    if (results.length === 0) {
      // Добавляем колонку status если её нет
      await sequelize.query(`
        ALTER TABLE executers
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive'))
      `);
      console.log('✅ Добавлена колонка status в таблицу executers');

      // Устанавливаем всем существующим исполнителям статус 'active'
      await sequelize.query(`
        UPDATE executers SET status = 'active' WHERE status IS NULL
      `);
      console.log('✅ Установлен статус "active" для всех существующих исполнителей');
    } else {
      console.log('ℹ️ Колонка status уже существует в таблице executers');
    }

    // Проверяем наличие индекса для более быстрых запросов по статусу
    const [indexResults] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'executers' AND indexname = 'idx_executers_status'
    `);

    if (indexResults.length === 0) {
      await sequelize.query(`
        CREATE INDEX idx_executers_status ON executers(status)
      `);
      console.log('✅ Создан индекс для колонки status');
    } else {
      console.log('ℹ️ Индекс для статуса уже существует');
    }

    console.log('🎉 Поддержка блокировки исполнителей успешно добавлена!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении поддержки блокировки:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Запускаем скрипт, если он вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  addExecuterBlockingSupport()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

export { addExecuterBlockingSupport };
