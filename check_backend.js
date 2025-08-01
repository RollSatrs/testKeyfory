// Простая проверка подключения к backend
const net = require('net');

console.log('🔍 === ПРОВЕРКА BACKEND СЕРВЕРА ===\n');

function checkBackend() {
  const client = new net.Socket();

  client.setTimeout(3000);

  client.connect(3000, 'localhost', () => {
    console.log('✅ Backend работает на порту 3000');
    client.destroy();
    process.exit(0);
  });

  client.on('error', (err) => {
    console.log('❌ Backend НЕ работает на порту 3000');
    console.log(`Ошибка: ${err.message}`);
    process.exit(1);
  });

  client.on('timeout', () => {
    console.log('❌ Timeout: Backend не отвечает');
    client.destroy();
    process.exit(1);
  });
}

checkBackend();
