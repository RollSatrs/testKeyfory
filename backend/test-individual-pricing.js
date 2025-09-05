import { Sequelize } from 'sequelize';
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:123@localhost:5432/keyfory_db');

async function checkIndividualPricing() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно');

    // Проверяем индивидуальные цены для исполнителей
    const [results] = await sequelize.query(`
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
      WHERE ep.individual_price IS NOT NULL
      AND ep.individual_price != s.price
      ORDER BY ep.executer_id;
    `);

    console.log('🔍 Найденные индивидуальные цены:');
    console.table(results);

    if (results.length === 0) {
      console.log('❌ Нет исполнителей с индивидуальными ценами, отличающимися от стандартных');

      // Создадим тестовую индивидуальную цену
      const testResult = await sequelize.query(`
        INSERT INTO executer_pricing (executer_id, service_id, individual_price, created_at, updated_at)
        VALUES (44, 1, 150.00, NOW(), NOW())
        ON CONFLICT (executer_id, service_id)
        DO UPDATE SET individual_price = 150.00, updated_at = NOW()
        RETURNING *;
      `);

      console.log('✅ Создана тестовая индивидуальная цена 150₽ для исполнителя 44, услуги 1');
    }

    // Теперь проверим, как данные передаются в функцию уведомлений
    console.log('\n🔍 Тестируем получение данных для уведомлений...');

    const [serviceData] = await sequelize.query(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.category,
        s.price as standardPrice,
        ep.individual_price as individualPrice
      FROM services s
      JOIN executer_services es ON s.id = es.service_id
      LEFT JOIN executer_pricing ep ON s.id = ep.service_id AND es.executer_id = ep.executer_id
      WHERE es.executer_id = 44
      ORDER BY s.id;
    `);

    console.log('📋 Данные услуг для исполнителя 44:');
    console.table(serviceData);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

checkIndividualPricing();
