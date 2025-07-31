import { sequelize } from './database/databaseOn.js';

const addExecuterIdField = async () => {
  try {
    console.log('🔄 Добавляем поле executer_id в таблицу services...');

    // Добавляем поле executer_id в таблицу services
    await sequelize.query(`
      ALTER TABLE services
      ADD COLUMN IF NOT EXISTS executer_id INTEGER REFERENCES executers(id) ON DELETE SET NULL;
    `);
    console.log('✅ Поле executer_id добавлено в таблицу services');

    console.log('🎉 Все поля успешно добавлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

addExecuterIdField();
