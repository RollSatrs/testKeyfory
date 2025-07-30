import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testExecuterAuth() {
  try {
    console.log('🔍 Тестируем авторизацию исполнителя...');
    console.log(`🌐 API URL: ${API_URL}`);

    const telegramId = '1165655712';

    console.log(`\n📞 Отправляем запрос авторизации для Telegram ID: ${telegramId}`);

    const response = await fetch(`${API_URL}/executer/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegram_id: telegramId
      })
    });

    console.log(`📡 Статус ответа: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Авторизация успешна!');
      console.log('📋 Данные исполнителя:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Ошибка авторизации:');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Ошибка сети:', error.message);

    // Проверяем, запущен ли сервер
    console.log('\n🔍 Проверяем доступность сервера...');
    try {
      const healthResponse = await fetch(`${API_URL.replace('/api', '')}/`);
      console.log(`📡 Сервер отвечает: ${healthResponse.status}`);
    } catch (healthError) {
      console.log('❌ Сервер недоступен. Убедитесь, что backend запущен!');
    }
  }
}

testExecuterAuth();
