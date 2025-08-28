import { sequelize } from '../database/databaseOn.js';

async function addMaterialUsedFields() {
  try {
    console.log('🔄 Добавляем поля is_used и used_reason в таблицу material...');

    // Проверяем, существуют ли уже поля
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'material'
      AND column_name IN ('is_used', 'used_reason')
    `);

    const existingColumns = results.map(row => row.column_name);

    // Добавляем поле is_used, если оно не существует
    if (!existingColumns.includes('is_used')) {
      await sequelize.query(`
        ALTER TABLE material
        ADD COLUMN is_used BOOLEAN DEFAULT false
      `);
      console.log('✅ Поле is_used добавлено');
    } else {
      console.log('⚠️ Поле is_used уже существует');
    }

    // Добавляем поле used_reason, если оно не существует
    if (!existingColumns.includes('used_reason')) {
      await sequelize.query(`
        ALTER TABLE material
        ADD COLUMN used_reason VARCHAR(255) NULL
      `);
      console.log('✅ Поле used_reason добавлено');
    } else {
      console.log('⚠️ Поле used_reason уже существует');
    }

    console.log('🎉 Миграция завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении полей:', error);
    throw error;
  }
}

// Запускаем миграцию
addMaterialUsedFields()
  .then(() => {
    console.log('✨ Все готово!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
