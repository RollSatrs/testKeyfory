// Простой тест для отладки проблемы

console.log('🔍 === ОТЛАДОЧНЫЙ ТЕСТ ===\n');

// Проверим, правильно ли работает обнаружение дубликатов
const testMessages = [
  'Order with number 123 already exists',
  'Заказ с номером 123 уже существует',
  'Такой заказ уже есть в системе',
  'Duplicate order number',
  'Invalid order format'
];

console.log('🧪 Тестируем обнаружение дубликатов:');
testMessages.forEach((message, index) => {
  const isDuplicateRus = message.includes('уже существует');
  const isDuplicateEng = message.includes('already exists');
  const isDuplicate = isDuplicateRus || isDuplicateEng;

  console.log(`${index + 1}. "${message}" → ${isDuplicate ? '✅ ДУБЛИКАТ' : '❌ НЕ ДУБЛИКАТ'}`);
});

console.log('\n🤔 Возможные причины проблемы:');
console.log('1. Сообщение об ошибке не содержит фразы "уже существует" или "already exists"');
console.log('2. Флаг afterDuplicate не устанавливается');
console.log('3. Флаг afterDuplicate очищается раньше времени');
console.log('4. Логика проверки в default case не срабатывает');

console.log('\n📝 Рекомендации:');
console.log('1. Запустить бота и посмотреть логи при вводе дубликата');
console.log('2. Проверить точное сообщение об ошибке от API');
console.log('3. Убедиться что флаг afterDuplicate устанавливается');
