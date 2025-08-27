import {sequelize} from '../database/databaseOn.js';

async function fixForeignKeyConstraint() {
    console.log('=== Исправление ограничения внешнего ключа ===\n');

    try {
        console.log('1. Удаляем старое ограничение CASCADE...');
        await sequelize.query(`
            ALTER TABLE executer_earnings
            DROP CONSTRAINT IF EXISTS executer_earnings_service_id_fkey
        `);

        console.log('2. Добавляем новое ограничение RESTRICT...');
        await sequelize.query(`
            ALTER TABLE executer_earnings
            ADD CONSTRAINT executer_earnings_service_id_fkey
            FOREIGN KEY (service_id) REFERENCES services(id)
            ON UPDATE CASCADE ON DELETE RESTRICT
        `);

        console.log('3. Проверяем новое ограничение...');
        const [constraints] = await sequelize.query(`
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.update_rule,
                rc.delete_rule
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'executer_earnings'
            AND kcu.column_name = 'service_id'
        `);

        console.log('Новое ограничение для service_id:');
        constraints.forEach((constraint) => {
            console.log(`  ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
            console.log(`  UPDATE: ${constraint.update_rule}, DELETE: ${constraint.delete_rule}`);
        });

        console.log('\n✅ Ограничение успешно изменено! Теперь заработки не будут удаляться при удалении услуг.');

    } catch (error) {
        console.error('Ошибка при изменении ограничения:', error);
    }
}

fixForeignKeyConstraint();
