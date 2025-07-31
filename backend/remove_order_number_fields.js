import { sequelize } from './database/databaseOn.js';

const removeOrderNumberColumns = async () => {
  try {
    console.log('🔄 Удаляем ненужные поля order_number...');

    // Удаляем поле order_number из таблицы services (если существует)
    try {
      await sequelize.query(`
        ALTER TABLE services
        DROP COLUMN IF EXISTS order_number;
      `);
      console.log('✅ Поле order_number удалено из таблицы services');
    } catch (error) {
      console.log('ℹ️ Поле order_number не существует в таблице services или уже удалено');
    }

    // Удаляем поле order_number из таблицы material (если существует)
    try {
      await sequelize.query(`
        ALTER TABLE material
        DROP COLUMN IF EXISTS order_number;
      `);
      console.log('✅ Поле order_number удалено из таблицы material');
    } catch (error) {
      console.log('ℹ️ Поле order_number не существует в таблице material или уже удалено');
    }

    console.log('🎉 Очистка базы данных завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

removeOrderNumberColumns();
