import { ServiceExecution } from './dbTables.js';
import { sequelize } from './databaseOn.js';

async function addPriceToServiceExecution() {
    try {
        console.log('🔄 Добавление поля price в таблицу service_executions...');

        // Добавляем колонку price
        await sequelize.getQueryInterface().addColumn('service_executions', 'price', {
            type: sequelize.Sequelize.FLOAT,
            allowNull: true,
            defaultValue: 0
        });

        console.log('✅ Поле price успешно добавлено в service_executions');

        // Обновляем существующие записи с примерными ценами
        const executions = await ServiceExecution.findAll();

        for (const execution of executions) {
            // Устанавливаем случайную цену от 500 до 5000
            const randomPrice = Math.floor(Math.random() * 4500) + 500;
            await execution.update({ price: randomPrice });
        }

        console.log(`✅ Обновлено ${executions.length} записей с ценами`);

    } catch (error) {
        console.error('❌ Ошибка добавления поля price:', error.message);
    }
}

addPriceToServiceExecution();
