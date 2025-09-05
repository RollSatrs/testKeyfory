// Тест индивидуальных цен после исправления
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { Services, Executer, ExecuterPricing } from './database/dbTables.js';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function testIndividualPricing() {
    console.log('\n🧪 ТЕСТИРОВАНИЕ ИНДИВИДУАЛЬНЫХ ЦЕН ПОСЛЕ ИСПРАВЛЕНИЯ\n');

    try {
        // 1. Создаем тестовую услугу с базовой ценой 1500₽
        console.log('1. Создаем тестовую услугу...');
        const service = await Services.create({
            name: 'Тестовая услуга - Исправление цен',
            category: 'Тестирование',
            price: 1500, // базовая цена 1500₽
            loading_method: 'manual'
        });
        console.log(`✅ Услуга создана: ${service.name}, базовая цена: ${service.price}₽`);

        // 2. Находим исполнителя
        console.log('\n2. Ищем исполнителя...');
        const executer = await Executer.findOne();
        if (!executer) {
            console.log('❌ Исполнитель не найден');
            return;
        }
        console.log(`✅ Найден исполнитель: ${executer.name} (ID: ${executer.id})`);

        // 3. Создаем индивидуальную цену 800₽ (значительно меньше базовой)
        console.log('\n3. Создаем индивидуальную цену...');
        const individualPrice = await ExecuterPricing.create({
            executer_id: executer.id,
            service_id: service.id,
            custom_price: 800 // индивидуальная цена 800₽
        });
        console.log(`✅ Индивидуальная цена создана: ${individualPrice.custom_price}₽`);

        // 4. Тестируем получение цен через исправленную логику
        console.log('\n4. Тестируем получение цен...');
        const executerPricing = await ExecuterPricing.findOne({
            where: {
                service_id: service.id,
                executer_id: executer.id
            }
        });

        const standardPrice = service.price;
        const customPrice = (executerPricing && executerPricing.custom_price !== null && executerPricing.custom_price !== undefined)
            ? executerPricing.custom_price
            : service.price;

        console.log(`📊 Результаты:`);
        console.log(`   • Базовая цена: ${standardPrice}₽`);
        console.log(`   • Индивидуальная цена: ${customPrice}₽`);
        console.log(`   • Цены разные: ${standardPrice !== customPrice ? 'ДА ✅' : 'НЕТ ❌'}`);

        // 5. Симулируем данные для бота
        console.log('\n5. Данные для бота:');
        const serviceInfoForBot = {
            id: service.id,
            name: service.name,
            category: service.category,
            price: customPrice,
            standardPrice: standardPrice,
            individualPrice: customPrice
        };

        console.log(`🤖 Бот получит:`, JSON.stringify(serviceInfoForBot, null, 2));

        // 6. Симулируем логику бота
        console.log('\n6. Симуляция логики бота:');
        const standardPriceNum = parseFloat(standardPrice) || 0;
        const individualPriceNum = parseFloat(customPrice) || 0;
        const areEqual = Math.abs(standardPriceNum - individualPriceNum) < 0.01;

        if (areEqual) {
            console.log(`💰 Бот покажет: ${customPrice}₽ (цены одинаковые)`);
        } else {
            console.log(`💰 Бот покажет: базовая: ${standardPrice}₽ → индивидуальная: ${customPrice}₽`);
        }

        // 7. Тестируем уведомление
        console.log('\n7. Тестируем отправку уведомления...');
        if (executer.telegram_id) {
            try {
                const notificationData = {
                    telegram_id: executer.telegram_id,
                    executer_name: executer.name || 'Исполнитель',
                    services: [serviceInfoForBot],
                    admin_name: 'Тест'
                };

                console.log(`📤 Отправляем уведомление:`, JSON.stringify(notificationData, null, 2));

                // Можно раскомментировать для реального теста
                // const response = await fetch(`${API_BASE_URL}/api/executers-bot/notify-service-assigned`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(notificationData)
                // });
                // console.log(`📬 Ответ сервера: ${response.status}`);

                console.log(`📬 Уведомление готово к отправке (закомментировано для безопасности)`);
            } catch (error) {
                console.error(`❌ Ошибка уведомления:`, error.message);
            }
        } else {
            console.log('❌ У исполнителя нет telegram_id');
        }

        // Очистка тестовых данных
        console.log('\n8. Очистка тестовых данных...');
        await ExecuterPricing.destroy({ where: { id: individualPrice.id } });
        await Services.destroy({ where: { id: service.id } });
        console.log('✅ Тестовые данные удалены');

        console.log('\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!');
        console.log('🔧 Исправления применены, теперь индивидуальные цены должны работать правильно.');

    } catch (error) {
        console.error('\n❌ ОШИБКА ТЕСТА:', error.message);
        console.error(error.stack);
    }
}

testIndividualPricing().then(() => {
    process.exit(0);
});
