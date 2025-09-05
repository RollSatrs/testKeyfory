import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Простой путь к .env файлу в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log(`📄 Использую .env файл: ${envPath}`);
dotenv.config({ path: envPath });

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Имитируем создание услуги через админ панель как в ServicesHeader.jsx
async function testAdminPricingFlow() {
    console.log('\n🧪 === ТЕСТ СОЗДАНИЯ ИНДИВИДУАЛЬНОЙ ЦЕНЫ ЧЕРЕЗ АДМИН ПАНЕЛЬ ===\n');

    try {
        // 1. Создаем новую услугу
        console.log('1️⃣ Создаем услугу...');
        const serviceResponse = await fetch(`${API_BASE_URL}/api/admin/services/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Тест админ индивидуальная цена',
                category: 'Тестирование',
                price: 500, // базовая цена 500₽
                loading_method: 'manual'
            })
        });

        if (!serviceResponse.ok) {
            throw new Error(`Ошибка создания услуги: ${serviceResponse.status}`);
        }

        const serviceData = await serviceResponse.json();
        const serviceId = serviceData.id;
        console.log(`✅ Услуга создана с ID: ${serviceId}, базовая цена: ${serviceData.price}₽`);

        // 2. Получаем исполнителя для тестирования
        console.log('\n2️⃣ Получаем исполнителя...');
        const executersResponse = await fetch(`${API_BASE_URL}/api/admin/executers/get`);
        const executers = await executersResponse.json();

        if (!executers || executers.length === 0) {
            throw new Error('Нет доступных исполнителей');
        }

        const testExecuter = executers[0];
        console.log(`👤 Используем исполнителя: ${testExecuter.name} (ID: ${testExecuter.id})`);

        // 3. Создаем индивидуальную цену (как в ServicesHeader.jsx)
        console.log('\n3️⃣ Создаем индивидуальную цену...');
        const pricingResponse = await fetch(`${API_BASE_URL}/api/admin/pricing/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                executer_id: testExecuter.id,
                service_id: serviceId,
                custom_price: 800 // индивидуальная цена 800₽
            })
        });

        if (!pricingResponse.ok) {
            throw new Error(`Ошибка создания индивидуальной цены: ${pricingResponse.status}`);
        }

        const pricingData = await pricingResponse.json();
        console.log(`💰 Индивидуальная цена создана:`, pricingData);

        // 4. Назначаем исполнителя на услугу (это вызовет уведомление)
        console.log('\n4️⃣ Назначаем исполнителя на услугу...');
        const assignResponse = await fetch(`${API_BASE_URL}/api/admin/services/${serviceId}/executers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                executerIds: [testExecuter.id]
            })
        });

        if (!assignResponse.ok) {
            throw new Error(`Ошибка назначения исполнителя: ${assignResponse.status}`);
        }

        const assignData = await assignResponse.json();
        console.log(`✅ Исполнитель назначен:`, assignData);

        console.log('\n🔍 === ОЖИДАЕМОЕ ПОВЕДЕНИЕ ===');
        console.log(`📋 Услуга: "${serviceData.name}"`);
        console.log(`💵 Базовая цена: ${serviceData.price}₽`);
        console.log(`💎 Индивидуальная цена: 800₽`);
        console.log(`👤 Исполнитель: ${testExecuter.name}`);
        console.log(`📱 Telegram ID: ${testExecuter.telegram_id}`);
        console.log(`📨 Ожидается уведомление: "базовая: 500₽ → индивидуальная: 800₽"`);

        // 5. Проверяем, что данные сохранились правильно
        console.log('\n5️⃣ Проверяем данные в ExecuterPricing...');
        const checkResponse = await fetch(`${API_BASE_URL}/api/executers-bot/services/${testExecuter.id}`);
        const executerServices = await checkResponse.json();

        const targetService = executerServices.find(s => s.id === serviceId);
        if (targetService) {
            console.log(`🔍 Найдена услуга в данных исполнителя:`, {
                id: targetService.id,
                name: targetService.name,
                price: targetService.price,
                standardPrice: targetService.standardPrice,
                individualPrice: targetService.individualPrice
            });
        } else {
            console.log('❌ Услуга не найдена в данных исполнителя');
        }

    } catch (error) {
        console.error('❌ Ошибка теста:', error.message);
    }
}

testAdminPricingFlow();
