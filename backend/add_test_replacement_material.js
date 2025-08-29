import { sequelize } from './database/databaseOn.js';
import { Material } from './database/dbTables.js';

async function addTestMaterial() {
    try {
        console.log('➕ Добавляем тестовый материал для замены...');

        const newMaterial = await Material.create({
            service_id: 168, // Brawl Pass
            status: 'available',
            contents: 'Новый материал для замены',
            name: 'test-replacement'
        });

        console.log(`✅ Материал добавлен: ID ${newMaterial.id}`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await sequelize.close();
    }
}

addTestMaterial();
