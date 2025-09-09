// Прямой тест через API endpoint для уведомлений

const testPayload = {
    telegram_id: '1165655712',
    executer_name: 'Rollan',
    services: [
        {
            id: 1,
            name: "ваапавпавпа",
            category: "Другое",
            price: 1500,              // для обратной совместимости
            standardPrice: 100,       // базовая цена услуги
            individualPrice: 1500     // индивидуальная цена исполнителя (отличается!)
        }
    ],
    admin_name: 'Реальный админ'
};

console.log('🧪 Тестируем уведомление через API endpoint...');
console.log('📤 Данные для отправки:');
console.table(testPayload.services);

// Отправляем POST запрос к API endpoint
import('node-fetch').then(({ default: fetch }) => {
    fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/executers-bot/notify-service-assigned`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
    })
    .then(response => {
        console.log(`📡 Ответ сервера: ${response.status} ${response.statusText}`);
        return response.json();
    })
    .then(data => {
        console.log('✅ Результат:', data);
        if (data.success) {
            console.log('🎉 Уведомление успешно отправлено! Проверьте Telegram.');
        }
    })
    .catch(error => {
        console.error('❌ Ошибка при отправке:', error.message);
    });
}).catch(error => {
    console.error('❌ Ошибка импорта fetch:', error.message);
});
