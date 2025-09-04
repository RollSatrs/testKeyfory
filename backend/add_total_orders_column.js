import { ExecuterServiceStatus } from './database/dbTables.js';
import { sequelize } from './database/databaseOn.js';

async function addTotalOrdersColumn() {
  try {
    console.log('🔄 Добавляем столбец total_orders в executer_service_status...');

    // Добавляем столбец total_orders если его нет
    await sequelize.query(`
      ALTER TABLE executer_service_status
      ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
    `);

    console.log('✅ Столбец total_orders успешно добавлен');

    // Проверяем структуру таблицы
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'executer_service_status'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Текущая структура таблицы executer_service_status:');
    tableInfo[0].forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Ошибка добавления столбца total_orders:', error);
  } finally {
    process.exit(0);
  }
}

addTotalOrdersColumn();
