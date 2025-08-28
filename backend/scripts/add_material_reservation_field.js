import { sequelize } from '../database/databaseOn.js';

async function addMaterialReservationField() {
  try {
    console.log('🔧 Добавление поля reserved_for в таблицу material...');

    // Добавляем поле reserved_for для хранения telegram_id пользователя, который резервирует материал
    await sequelize.query(`
      ALTER TABLE material
      ADD COLUMN IF NOT EXISTS reserved_for BIGINT NULL,
      ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP NULL;
    `);

    console.log('✅ Поля reserved_for и reserved_at добавлены успешно');

    // Проверим структуру таблицы
    const [results] = await sequelize.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'material' AND column_name LIKE 'reserved%';");
    console.log('\n📋 Добавленные поля резервации:');
    results.forEach(field => {
      console.log(`  - ${field.column_name}: ${field.data_type} (${field.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error('❌ Ошибка при добавлении полей резервации:', error);
  } finally {
    await sequelize.close();
  }
}

addMaterialReservationField();
