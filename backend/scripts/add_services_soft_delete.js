import { sequelize } from '../database/databaseOn.js';

async function addServicesSoftDeleteFields() {
  try {
    console.log('🔄 Добавляем поля soft delete в таблицу services...');

    // Проверяем, существуют ли уже поля
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'services'
      AND column_name IN ('is_deleted', 'deleted_at', 'deleted_by', 'archived_name', 'archived_category')
    `);

    const existingColumns = results.map(row => row.column_name);

    // Добавляем поле is_deleted, если оно не существует
    if (!existingColumns.includes('is_deleted')) {
      await sequelize.query(`
        ALTER TABLE services
        ADD COLUMN is_deleted BOOLEAN DEFAULT false
      `);
      console.log('✅ Поле is_deleted добавлено');
    } else {
      console.log('⚠️ Поле is_deleted уже существует');
    }

    // Добавляем поле deleted_at, если оно не существует
    if (!existingColumns.includes('deleted_at')) {
      await sequelize.query(`
        ALTER TABLE services
        ADD COLUMN deleted_at TIMESTAMP NULL
      `);
      console.log('✅ Поле deleted_at добавлено');
    } else {
      console.log('⚠️ Поле deleted_at уже существует');
    }

    // Добавляем поле deleted_by, если оно не существует
    if (!existingColumns.includes('deleted_by')) {
      await sequelize.query(`
        ALTER TABLE services
        ADD COLUMN deleted_by INTEGER NULL REFERENCES admins(id)
      `);
      console.log('✅ Поле deleted_by добавлено');
    } else {
      console.log('⚠️ Поле deleted_by уже существует');
    }

    // Добавляем поле archived_name, если оно не существует
    if (!existingColumns.includes('archived_name')) {
      await sequelize.query(`
        ALTER TABLE services
        ADD COLUMN archived_name VARCHAR(255) NULL
      `);
      console.log('✅ Поле archived_name добавлено');
    } else {
      console.log('⚠️ Поле archived_name уже существует');
    }

    // Добавляем поле archived_category, если оно не существует
    if (!existingColumns.includes('archived_category')) {
      await sequelize.query(`
        ALTER TABLE services
        ADD COLUMN archived_category VARCHAR(255) NULL
      `);
      console.log('✅ Поле archived_category добавлено');
    } else {
      console.log('⚠️ Поле archived_category уже существует');
    }

    console.log('🎉 Миграция soft delete для services завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении полей:', error);
    throw error;
  }
}

// Запускаем миграцию
addServicesSoftDeleteFields()
  .then(() => {
    console.log('✨ Все готово!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
