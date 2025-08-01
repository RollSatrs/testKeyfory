// Скрипт для тестирования API endpoint
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';
const EXECUTER_ID = 20;

console.log('🔍 === ТЕСТИРОВАНИЕ API ENDPOINT ===\n');

async function testAPI() {
  try {
    console.log(`📡 Запрос: GET ${API_URL}/api/executers/services/${EXECUTER_ID}`);

    const response = await fetch(`${API_URL}/api/executers/services/${EXECUTER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Статус ответа: ${response.status}`);
    console.log(`📊 Статус OK: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Ошибка: ${errorText}`);
      return;
    }

    const services = await response.json();
    console.log(`📋 Найдено услуг: ${services.length}`);

    if (services.length > 0) {
      console.log('\n🎯 УСЛУГИ:');
      services.forEach(service => {
        console.log(`- ID: ${service.id}`);
        console.log(`- Name: ${service.name}`);
        console.log(`- Price: ${service.price}`);
        console.log(`- Category: ${service.category}`);
        console.log('---');
      });
    } else {
      console.log('❌ Услуги не найдены');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
  }

  process.exit(0);
}

testAPI();
