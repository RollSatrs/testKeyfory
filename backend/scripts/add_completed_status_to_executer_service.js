import { sequelize } from '../database/databaseOn.js';

async function addCompletedStatusToExecuterService() {
    try {
        console.log('🔄 Добавление статуса "completed" в ExecuterServiceStatus...');

        // Проверяем текущую структуру таблицы
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'executer_service_status' AND column_name = 'status'
        `);

        console.log('📊 Текущая структура колонки status:', results);

        // Обновляем тип данных колонки status для поддержки ENUM с новым значением
        // Сначала изменяем тип на VARCHAR, затем обратно на ENUM с новыми значениями
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ALTER COLUMN status TYPE VARCHAR(20)
        `);

        console.log('✅ Тип колонки изменен на VARCHAR');

        // Добавляем constraint для ENUM значений
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ADD CONSTRAINT executer_service_status_enum_check
            CHECK (status IN ('inactive', 'active', 'completed'))
        `);

        console.log('✅ Добавлен constraint для ENUM значений');

        // Проверяем что все работает
        const [statusCheck] = await sequelize.query(`
            SELECT DISTINCT status FROM executer_service_status
        `);

        console.log('📊 Текущие статусы в таблице:', statusCheck.map(r => r.status));

        console.log('🎉 Статус "completed" успешно добавлен в ExecuterServiceStatus!');
        console.log('✅ Скрипт завершен успешно');

    } catch (error) {
        console.error('❌ Ошибка при добавлении статуса "completed":', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

addCompletedStatusToExecuterService()
    .then(() => {
        console.log('✅ Миграция завершена');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка миграции:', error);
        process.exit(1);
    });
