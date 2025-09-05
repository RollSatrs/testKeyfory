// Тест для проверки индивидуальных цен в уведомлениях

// Тестовые данные, которые должна передавать adminExecuterService.js
const testServiceData = [
    {
        id: 1,
        name: "Тестовая услуга",
        category: "Тестовая категория",
        price: 100,              // для обратной совместимости
        standardPrice: 100,      // базовая цена услуги
        individualPrice: 150     // индивидуальная цена исполнителя (отличается!)
    },
    {
        id: 2,
        name: "Обычная услуга",
        category: "Обычная категория",
        price: 200,              // для обратной совместимости
        standardPrice: 200,      // базовая цена услуги
        individualPrice: 200     // индивидуальная цена равна базовой
    }
];

// Импортируем функцию уведомления
import('../bot/executerBot.js').then(botModule => {
    console.log('🧪 Тестируем функцию notifyServiceAssigned с данными:');
    console.table(testServiceData);

    // Вызываем функцию уведомления с тестовыми данными
    botModule.notifyServiceAssigned(
        '1165655712', // реальный telegram_id исполнителя Rollan
        'Rollan',
        testServiceData,
        'Тестовый админ'
    ).then(success => {
        if (success) {
            console.log('✅ Тест уведомления выполнен успешно');
        } else {
            console.log('❌ Тест уведомления неуспешен');
        }
    }).catch(error => {
        console.error('❌ Ошибка теста:', error.message);
    });

}).catch(error => {
    console.error('❌ Ошибка импорта бота:', error.message);
});
