// Скрипт для очистки данных статистики заработка
import fetch from 'node-fetch';

async function getAdminToken() {
    try {
        const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegramId: process.env.ADMIN_TELEGRAM_ID || '123456789',
                password: process.env.ADMIN_PASSWORD || 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok && loginData.token) {
            console.log('✅ Успешная авторизация!');
            return loginData.token;
        } else {
            console.log('❌ Ошибка авторизации:', loginData);
            return null;
        }
    } catch (error) {
        console.error('❌ Ошибка при получении токена:', error);
        return null;
    }
}

async function clearEarningsData() {
    console.log('🗑️ Начинаем очистку данных статистики заработка...');
    const token = await getAdminToken();

    if (!token) {
        console.log('❌ Не удалось получить токен. Завершаем операцию.');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Используем специальный API для полной очистки данных
        console.log('🧹 Вызываем API очистки всех данных...');

        const clearResponse = await fetch('http://localhost:3000/api/admin/earnings/clear-all-data', {
            method: 'DELETE',
            headers
        });

        if (clearResponse.ok) {
            const result = await clearResponse.json();
            console.log('✅ Успешная очистка:', result.message);
            console.log(`📊 Удалено ServiceExecution записей: ${result.deletedServiceExecutions}`);
            console.log(`💰 Удалено ExecuterPricing записей: ${result.deletedPricing}`);
        } else {
            const error = await clearResponse.text();
            console.log('❌ Ошибка при очистке:', error);
        }

        console.log('🎉 Очистка данных завершена!');
        console.log('📝 Теперь в системе ценообразования будут показываться демо-данные или пустые таблицы');

    } catch (error) {
        console.error('❌ Ошибка при очистке данных:', error);
    }
}

// Запускаем очистку
clearEarningsData();
