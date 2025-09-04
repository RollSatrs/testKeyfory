import { sequelize } from '../database/databaseOn.js';

async function fixExecuterServiceStatusEnum() {
    try {
        console.log('🔧 Исправление ENUM для executer_service_status...');

        // Сначала удалим существующий constraint и ENUM тип, если он есть
        try {
            await sequelize.query(`
                ALTER TABLE executer_service_status
                DROP CONSTRAINT IF EXISTS executer_service_status_enum_check
            `);
            console.log('✅ Удален старый constraint');
        } catch (e) {
            console.log('ℹ️ Старый constraint не найден (это нормально)');
        }

        // Удаляем старый ENUM тип, если он существует
        try {
            await sequelize.query(`
                DROP TYPE IF EXISTS "public"."enum_executer_service_status_status" CASCADE
            `);
            console.log('✅ Удален старый ENUM тип');
        } catch (e) {
            console.log('ℹ️ Старый ENUM тип не найден (это нормально)');
        }

        // Сначала изменяем тип колонки на VARCHAR
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ALTER COLUMN status TYPE VARCHAR(20)
        `);
        console.log('✅ Изменен тип колонки на VARCHAR');

        // Убираем default временно
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ALTER COLUMN status DROP DEFAULT
        `);
        console.log('✅ Убран временный default');

        // Создаем новый ENUM тип
        await sequelize.query(`
            CREATE TYPE "public"."enum_executer_service_status_status" AS ENUM('inactive', 'active', 'completed')
        `);
        console.log('✅ Создан новый ENUM тип');

        // Обновляем все некорректные значения
        await sequelize.query(`
            UPDATE executer_service_status
            SET status = 'inactive'
            WHERE status NOT IN ('inactive', 'active', 'completed')
        `);
        console.log('✅ Обновлены некорректные значения статусов');

        // Изменяем тип колонки на ENUM
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ALTER COLUMN status TYPE "public"."enum_executer_service_status_status"
            USING status::"public"."enum_executer_service_status_status"
        `);
        console.log('✅ Изменен тип колонки на ENUM');

        // Устанавливаем default значение
        await sequelize.query(`
            ALTER TABLE executer_service_status
            ALTER COLUMN status SET DEFAULT 'inactive'
        `);
        console.log('✅ Установлен default для колонки');

        // Проверяем результат
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'executer_service_status' AND column_name = 'status'
        `);

        console.log('📊 Финальная структура колонки status:', results[0]);

        // Проверяем данные
        const [statusData] = await sequelize.query(`
            SELECT status, COUNT(*) as count
            FROM executer_service_status
            GROUP BY status
        `);

        console.log('📊 Распределение статусов:');
        statusData.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        console.log('🎉 ENUM успешно исправлен!');
        console.log('✅ Скрипт завершен успешно');

    } catch (error) {
        console.error('❌ Ошибка при исправлении ENUM:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

fixExecuterServiceStatusEnum()
    .then(() => {
        console.log('✅ Исправление завершено');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка исправления:', error);
        process.exit(1);
    });
