import { sequelize } from '../database/databaseOn.js';

async function addReplacementTypeField() {
  try {
    console.log('🔄 Добавление поля replacement_type в таблицу services...');

    // Проверяем, существует ли поле
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='services' AND column_name='replacement_type';
    `);

    if (results.length > 0) {
      console.log('✅ Поле replacement_type уже существует');
      return;
    }

    // Добавляем поле
    await sequelize.query(`
      ALTER TABLE services
      ADD COLUMN replacement_type VARCHAR(10) DEFAULT 'manual';
    `);

    // Устанавливаем значения по умолчанию для существующих записей
    await sequelize.query(`
      UPDATE services
      SET replacement_type = 'manual'
      WHERE replacement_type IS NULL;
    `);

    console.log('✅ Поле replacement_type успешно добавлено');

  } catch (error) {
    console.error('❌ Ошибка при добавлении поля replacement_type:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Запуск скрипта
addReplacementTypeField()
  .then(() => {
    console.log('🎉 Миграция завершена успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка миграции:', error);
    process.exit(1);
  });
