// Тест для создания индивидуальной цены
import('node-fetch').then(({ default: fetch }) => {
    const testData = {
        telegram_id: '1165655712',
        executer_name: 'Rollan',
        services: [
            {
                id: 256,
                name: "Windows 0",
                category: "Программное обеспечение",
                price: 1500,              // для обратной совместимости
                standardPrice: 100,       // НОВАЯ базовая цена услуги
                individualPrice: 1500     // индивидуальная цена исполнителя (отличается!)
            }
        ],
        admin_name: 'Тест админ'
    };

    console.log('🧪 Тестируем с исправленными данными:');
    console.table(testData.services);

    fetch('http://localhost:3000/api/executers-bot/notify-service-assigned', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
    })
    .then(response => {
        console.log(`📡 Ответ: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('✅ Результат:', data);
        if (data.success) {
            console.log('🎉 Тест с базовой ценой 100₽ и индивидуальной 1500₽ - должно показать обе цены!');
        }
    })
    .catch(error => {
        console.error('❌ Ошибка:', error.message);
    });
}).catch(error => {
    console.error('❌ Ошибка импорта:', error.message);
});
