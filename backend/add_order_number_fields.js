import { sequelize } from './database/databaseOn.js';

const addColumns = async () => {
  try {
    console.log('🔄 Добавляем поля order_number...');

    // Добавляем поле order_number в таблицу services
    await sequelize.query(`
      ALTER TABLE services
      ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);
    `);
    console.log('✅ Поле order_number добавлено в таблицу services');

    // Добавляем поле order_number в таблицу material
    await sequelize.query(`
      ALTER TABLE material
      ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);
    `);
    console.log('✅ Поле order_number добавлено в таблицу material');

    console.log('🎉 Все поля успешно добавлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

addColumns();
