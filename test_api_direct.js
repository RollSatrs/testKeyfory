// HTTP запрос без node-fetch
const http = require('http');

console.log('🔍 === ТЕСТ API ENDPOINT ===\n');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/executers/services/20',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Статус: ${res.statusCode}`);
    console.log(`📊 Заголовки:`, res.headers);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n📋 ОТВЕТ API:');
      try {
        const services = JSON.parse(data);
        console.log(`Найдено услуг: ${services.length}`);

        if (services.length > 0) {
          services.forEach(service => {
            console.log(`- ID: ${service.id}, Name: ${service.name}, Price: ${service.price}`);
          });
        }
      } catch (error) {
        console.log('❌ Ошибка парсинга JSON:', error.message);
        console.log('Raw response:', data);
      }

      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка запроса:', error.message);
    process.exit(1);
  });

  req.end();
}

testAPI();
