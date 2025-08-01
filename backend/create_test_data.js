import { sequelize } from './database/databaseOn.js';
import { Services, Material, Executer, ServiceExecution, MaterialReplacement, ServiceAccess } from './database/dbTables.js';

async function createTestData() {
    try {
        console.log('🔄 Создание тестовых данных...');

        // Получаем существующие данные
        const services = await Services.findAll();
        let materials = await Material.findAll();
        const executers = await Executer.findAll();

        console.log(`📊 Найдено: ${services.length} услуг, ${materials.length} материалов, ${executers.length} исполнителей`);

        if (services.length === 0 || executers.length === 0) {
            console.log('❌ Недостаточно услуг или исполнителей для создания тестовых связей');
            return;
        }

        // 0. Создаем тестовые материалы если их нет
        if (materials.length === 0) {
            console.log('🔨 Создание тестовых материалов...');
            for (let i = 0; i < services.length; i++) {
                const service = services[i];

                // Создаем по 3 материала для каждой услуги
                for (let j = 1; j <= 3; j++) {
                    const material = await Material.create({
                        service_id: service.id,
                        contents: `TEST-KEY-${service.id}-${j}`,
                        type_key: 'key',
                        status: 'available',
                        source: 'test',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    console.log(`✅ Создан тестовый материал: ${material.contents} для услуги "${service.name}"`);
                }
            }

            // Обновляем список материалов
            materials = await Material.findAll();
            console.log(`📊 Теперь материалов: ${materials.length}`);
        }

        // 1. Создаем тестовые ServiceExecution записи
        console.log('🔨 Создание тестовых заказов...');
        const testExecutions = [];
        for (let i = 0; i < Math.min(5, services.length); i++) {
            const service = services[i];
            const executer = executers[i % executers.length];

            const execution = await ServiceExecution.create({
                service_id: service.id,
                executer_id: executer.id,
                order_number: `TEST-${1000 + i}`,
                status: i % 2 === 0 ? 'completed' : 'in_progress',
                started_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
                materials_used: []
            });
            testExecutions.push(execution);
            console.log(`✅ Создан тестовый заказ: ${execution.order_number} для услуги "${service.name}"`);
        }

        // 2. Создаем тестовые MaterialReplacement записи (связи материал-заказ)
        console.log('🔨 Создание связей материал-заказ...');
        for (let i = 0; i < Math.min(materials.length, testExecutions.length); i++) {
            const material = materials[i];
            const execution = testExecutions[i];

            const replacement = await MaterialReplacement.create({
                material_id: material.id,
                execution_id: execution.id,
                executer_id: execution.executer_id,
                service_id: material.service_id,
                reason: 'Материал использован в заказе (тест)',
                status: 'approved',
                processed_at: new Date(),
                created_at: new Date()
            });

            console.log(`✅ Создана связь: Material ${material.id} → Execution ${execution.order_number}`);
        }

        // 3. Создаем связи Services ↔ Executers через ServiceAccess
        console.log('🔨 Создание связей услуга-исполнитель...');
        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const executer = executers[i % executers.length];

            // Проверяем, есть ли уже такая связь
            const existingAccess = await ServiceAccess.findOne({
                where: {
                    service_id: service.id,
                    executer_id: executer.id
                }
            });

            if (!existingAccess) {
                await ServiceAccess.create({
                    service_id: service.id,
                    executer_id: executer.id,
                    has_access: true,
                    can_replace_materials: true,
                    requires_approval: false,
                    created_at: new Date()
                });
                console.log(`✅ Создана связь: Услуга "${service.name}" → Исполнитель "${executer.name}"`);
            }
        }

        console.log('🎉 Все тестовые данные созданы успешно!');
        console.log(`📈 Создано: ${testExecutions.length} заказов, ${materials.length} связей материал-заказ, связи услуг с исполнителями`);

    } catch (error) {
        console.error('❌ Ошибка создания тестовых данных:', error);
        throw error;
    }
}

// Запуск функции
createTestData()
    .then(() => {
        console.log('✅ Скрипт завершен успешно');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка выполнения скрипта:', error);
        process.exit(1);
    });
