import { sequelize } from './database/databaseOn.js';
import { Services } from './database/dbTables.js';

async function updateServiceReplacementType() {
    try {
        console.log('🔄 Обновляем тип замены для услуги 169...');

        const service = await Services.findByPk(169);

        if (service) {
            console.log(`Текущий тип замены: ${service.replacement_type}`);

            // Обновляем тип замены на auto
            await service.update({ replacement_type: 'auto' });

            console.log(`✅ Тип замены обновлен на: auto`);
        } else {
            console.log('❌ Услуга 169 не найдена');
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await sequelize.close();
    }
}

updateServiceReplacementType();
