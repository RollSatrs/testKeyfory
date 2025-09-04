import { Sequelize } from 'sequelize';
import { sequelize } from '../database/databaseOn.js';

async function addExecuterOnlineTracking() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('🔄 Добавляем поля для отслеживания онлайн статуса исполнителей...');

        // Добавляем поле last_bot_activity для отслеживания последней активности в боте
        await queryInterface.addColumn('executers', 'last_bot_activity', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Время последней активности в боте'
        });

        // Добавляем поле is_bot_active для быстрого определения онлайн статуса
        await queryInterface.addColumn('executers', 'is_bot_active', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: 'Активен ли исполнитель в боте в данный момент'
        });

        console.log('✅ Поля успешно добавлены:');
        console.log('   - last_bot_activity: для хранения времени последней активности в боте');
        console.log('   - is_bot_active: для быстрого определения онлайн статуса');

        console.log('🎯 Теперь онлайн статус будет определяться реальной активностью в боте!');

    } catch (error) {
        console.error('❌ Ошибка при добавлении полей:', error);
        throw error;
    }
}

addExecuterOnlineTracking()
    .then(() => {
        console.log('🎉 Миграция завершена успешно!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Ошибка миграции:', error);
        process.exit(1);
    });
