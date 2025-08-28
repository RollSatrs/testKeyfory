import { sequelize } from '../database/databaseOn.js';

async function addMaterialExecuterFields() {
  try {
    console.log('🔄 Добавляем поля executer_id и executer_name в таблицу material...');

    // Проверяем, существуют ли уже поля
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'material'
      AND column_name IN ('executer_id', 'executer_name')
    `);

    const existingColumns = results.map(row => row.column_name);

    // Добавляем поле executer_id, если оно не существует
    if (!existingColumns.includes('executer_id')) {
      await sequelize.query(`
        ALTER TABLE material
        ADD COLUMN executer_id INTEGER NULL REFERENCES executers(id)
      `);
      console.log('✅ Поле executer_id добавлено');
    } else {
      console.log('⚠️ Поле executer_id уже существует');
    }

    // Добавляем поле executer_name, если оно не существует
    if (!existingColumns.includes('executer_name')) {
      await sequelize.query(`
        ALTER TABLE material
        ADD COLUMN executer_name VARCHAR(255) NULL
      `);
      console.log('✅ Поле executer_name добавлено');
    } else {
      console.log('⚠️ Поле executer_name уже существует');
    }

    console.log('🎉 Миграция завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении полей:', error);
    throw error;
  }
}

// Запускаем миграцию
addMaterialExecuterFields()
  .then(() => {
    console.log('✨ Все готово!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
