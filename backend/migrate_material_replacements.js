import { sequelize } from './database/databaseOn.js';

async function migrateMaterialReplacements() {
    try {
        console.log('🔄 Выполняем миграцию таблицы material_replacements...');

        // Сначала удаляем старый внешний ключ на orders
        await sequelize.query(`
            ALTER TABLE material_replacements
            DROP CONSTRAINT IF EXISTS material_replacements_order_id_fkey;
        `);
        console.log('✅ Удален внешний ключ на orders');

        // Переименовываем колонку order_id в service_execution_id
        await sequelize.query(`
            ALTER TABLE material_replacements
            RENAME COLUMN order_id TO service_execution_id;
        `);
        console.log('✅ Переименована колонка order_id -> service_execution_id');

        // Добавляем новый внешний ключ на service_executions
        await sequelize.query(`
            ALTER TABLE material_replacements
            ADD CONSTRAINT material_replacements_service_execution_id_fkey
            FOREIGN KEY (service_execution_id) REFERENCES service_executions(id);
        `);
        console.log('✅ Добавлен внешний ключ на service_executions');

        console.log('🎉 Миграция завершена успешно!');

    } catch (error) {
        console.error('❌ Ошибка миграции:', error.message);
    } finally {
        await sequelize.close();
    }
}

migrateMaterialReplacements();
