import { ServiceExecution, Services, Executer } from './database/dbTables.js';

async function createTestServiceExecutions() {
    try {
        console.log('🎯 Создание тестовых данных ServiceExecution...');

        // Получаем существующие услуги и исполнителей
        const services = await Services.findAll();
        const executers = await Executer.findAll();

        if (services.length === 0 || executers.length === 0) {
            console.log('❌ Нет услуг или исполнителей для создания тестовых данных');
            return;
        }

        // Удаляем старые тестовые данные
        await ServiceExecution.destroy({ where: {} });

        const testExecutions = [];

        // Создаем тестовые выполнения за последние 30 дней
        for (let i = 0; i < 50; i++) {
            const randomService = services[Math.floor(Math.random() * services.length)];
            const randomExecuter = executers[Math.floor(Math.random() * executers.length)];

            // Случайная дата за последние 30 дней
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

            // Случайная цена от 500 до 5000
            const price = Math.floor(Math.random() * 4500) + 500;

            // 80% заказов завершены, 20% в работе
            const status = Math.random() > 0.2 ? 'completed' : 'in_progress';

            testExecutions.push({
                service_id: randomService.id,
                executer_id: randomExecuter.id,
                order_number: 1000 + i,
                price: price,
                status: status,
                created_at: randomDate,
                completed_at: status === 'completed' ? randomDate : null
            });
        }

        // Массовое создание
        const created = await ServiceExecution.bulkCreate(testExecutions);

        console.log(`✅ Создано ${created.length} тестовых записей ServiceExecution`);

        // Статистика
        const totalEarnings = await ServiceExecution.sum('price', {
            where: { status: 'completed' }
        });

        const completedCount = await ServiceExecution.count({
            where: { status: 'completed' }
        });

        console.log(`💰 Общий заработок: ₽${totalEarnings}`);
        console.log(`✅ Завершенных заказов: ${completedCount}`);

    } catch (error) {
        console.error('❌ Ошибка создания тестовых данных:', error);
    }
}

createTestServiceExecutions();
