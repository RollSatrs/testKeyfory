import { sequelize } from './database/databaseOn.js';

async function fixMaterialReplacementsSchema() {
    try {
        console.log('🔄 Исправляем схему таблицы material_replacements...');

        // Делаем order_id nullable
        await sequelize.query(`
            ALTER TABLE material_replacements
            ALTER COLUMN order_id DROP NOT NULL;
        `);
        console.log('✅ Поле order_id теперь может быть NULL');

        console.log('🎉 Схема исправлена!');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await sequelize.close();
    }
}

fixMaterialReplacementsSchema();
