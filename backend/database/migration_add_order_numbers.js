import { sequelize } from './databaseOn.js';

export async function addOrderNumberFields() {
    try {
        console.log('🔄 Добавляем поля order_number в таблицы...');

        // Добавляем поле order_number в таблицу services
        await sequelize.query(`
            ALTER TABLE services
            ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);
        `);

        // Добавляем поле order_number в таблицу material
        await sequelize.query(`
            ALTER TABLE material
            ADD COLUMN IF NOT EXISTS order_number VARCHAR(255);
        `);

        console.log('✅ Поля order_number успешно добавлены в таблицы services и material');

        return true;
    } catch (error) {
        console.error('❌ Ошибка при добавлении полей order_number:', error);
        throw error;
    }
}

// Запускаем миграцию если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addOrderNumberFields()
        .then(() => {
            console.log('✅ Миграция завершена');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка миграции:', error);
            process.exit(1);
        });
}
