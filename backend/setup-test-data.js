import pkg from 'pg';
const { Client } = pkg;

async function testIndividualPricing() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:123@localhost:5432/keyfory_db'
    });

    try {
        await client.connect();
        console.log('✅ Подключение к БД успешно');

        // Создаем тестовую индивидуальную цену для исполнителя 44
        await client.query(`
            INSERT INTO executer_pricing (executer_id, service_id, individual_price, created_at, updated_at)
            VALUES (44, 1, 150.00, NOW(), NOW())
            ON CONFLICT (executer_id, service_id)
            DO UPDATE SET individual_price = 150.00, updated_at = NOW();
        `);
        console.log('✅ Создана индивидуальная цена 150₽ для исполнителя 44, услуги 1');

        // Проверяем данные
        const result = await client.query(`
            SELECT
                ep.executer_id,
                e.name as executer_name,
                e.telegram_id,
                s.name as service_name,
                s.price as standard_price,
                ep.individual_price
            FROM executer_pricing ep
            JOIN executers e ON ep.executer_id = e.id
            JOIN services s ON ep.service_id = s.id
            WHERE ep.executer_id = 44 AND ep.service_id = 1;
        `);

        console.log('🔍 Данные для тестирования:');
        console.table(result.rows);

        if (result.rows.length > 0) {
            const testData = result.rows[0];
            console.log('🧪 Тестовые данные готовы:');
            console.log(`- Исполнитель: ${testData.executer_name} (ID: ${testData.executer_id})`);
            console.log(`- Telegram ID: ${testData.telegram_id}`);
            console.log(`- Услуга: ${testData.service_name}`);
            console.log(`- Базовая цена: ${testData.standard_price}₽`);
            console.log(`- Индивидуальная цена: ${testData.individual_price}₽`);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await client.end();
    }
}

testIndividualPricing();
