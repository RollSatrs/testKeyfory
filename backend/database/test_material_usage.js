import { MaterialReplacement, ServiceExecution, Material, Executer } from './dbTables.js';

// Тестовая функция для создания связей материал-заказ
export async function createTestMaterialUsage() {
    try {
        console.log('🔨 Создание тестовых связей материал-заказ...');

        // Получаем существующие данные
        const materials = await Material.findAll({ limit: 3 });
        const executions = await ServiceExecution.findAll({ limit: 5 });
        const executers = await Executer.findAll({ limit: 2 });

        if (materials.length === 0 || executions.length === 0 || executers.length === 0) {
            console.log('❌ Недостаточно данных для создания тестовых связей');
            return;
        }

        // Создаем тестовые записи MaterialReplacement
        for (let i = 0; i < Math.min(materials.length, executions.length); i++) {
            const material = materials[i];
            const execution = executions[i];
            const executer = executers[i % executers.length];

            await MaterialReplacement.create({
                material_id: material.id,
                executer_id: executer.id,
                execution_id: execution.id,
                service_id: material.service_id,
                reason: 'Материал использован в заказе (тест)',
                status: 'approved',
                processed_at: new Date(),
                created_at: new Date()
            });

            console.log(`✅ Создана связь: Material ${material.id} → Execution ${execution.id}`);
        }

        console.log('✅ Тестовые связи созданы успешно!');

    } catch (error) {
        console.error('❌ Ошибка создания тестовых связей:', error);
    }
}

// Запуск функции если файл вызывается напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    createTestMaterialUsage().then(() => process.exit(0));
}
