import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';


// Загружаем переменные окружения
dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' })

const BOT_TOKEN = process.env.CLIENTNOT;
const WEBAPP_URL = process.env.WEBAPP_URL

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Данные пользователей (в реальном проекте используйте базу данных)
const users = new Map();

// Приветственное сообщение
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;

    // Сохраняем пользователя
    users.set(userId, {
        id: userId,
        chatId: chatId,
        firstName: firstName,
        username: msg.from.username,
        balance: 0,
        orders: []
    });

    const welcomeMessage = `🎉 Добро пожаловать в KeyFory, ${firstName}!

🔑 Здесь вы можете приобрести:
• Игровые ключи и подписки
• Стриминговые сервисы
• Программное обеспечение
• Социальные сети премиум

💫 Все услуги проверены и гарантированы!`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🛍️ Открыть магазин',
                    web_app: { url: WEBAPP_URL }
                }
            ],
            [
                { text: '👤 Мой профиль', callback_data: 'profile' },
                { text: '📊 Статистика', callback_data: 'stats' }
            ],
            [
                { text: '📋 Мои заказы', callback_data: 'orders' },
                { text: '💰 Баланс', callback_data: 'balance' }
            ],
            [
                { text: '❓ Помощь', callback_data: 'help' },
                { text: '📞 Поддержка', callback_data: 'support' }
            ]
        ]
    };

    bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
});

// Обработка callback кнопок
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    const user = users.get(userId) || {
        id: userId,
        firstName: query.from.first_name,
        balance: 0,
        orders: []
    };

    switch (data) {
        case 'profile':
            showProfile(chatId, user);
            break;
        case 'stats':
            showStats(chatId, user);
            break;
        case 'orders':
            showOrders(chatId, user);
            break;
        case 'balance':
            showBalance(chatId, user);
            break;
        case 'help':
            showHelp(chatId);
            break;
        case 'support':
            showSupport(chatId);
            break;
        case 'back_to_menu':
            showMainMenu(chatId, user);
            break;
    }

    bot.answerCallbackQuery(query.id);
});

// Функция показа профиля
function showProfile(chatId, user) {
    const profileMessage = `👤 Ваш профиль

🆔 ID: ${user.id}
👋 Имя: ${user.firstName}
💰 Баланс: ${user.balance} ₽
📋 Заказов: ${user.orders.length}
⭐ Статус: ${user.balance > 1000 ? 'VIP клиент' : 'Обычный клиент'}

🎯 Активность:
• Последний заказ: ${user.orders.length > 0 ? 'Вчера' : 'Нет заказов'}
• На платформе с: ${new Date().toLocaleDateString('ru-RU')}`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🛍️ Перейти в магазин',
                    web_app: { url: WEBAPP_URL }
                }
            ],
            [
                { text: '💰 Пополнить баланс', callback_data: 'add_balance' },
                { text: '📋 Мои заказы', callback_data: 'orders' }
            ],
            [
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(profileMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, profileMessage, { reply_markup: keyboard });
    });
}

// Функция показа статистики
function showStats(chatId, user) {
    const statsMessage = `📊 Статистика KeyFory

🔥 Популярные категории:
1. 🎮 Игры - 45%
2. 📺 Стриминг - 30%
3. 💻 ПО - 15%
4. 📱 Соцсети - 10%

💫 Ваша активность:
• Заказов: ${user.orders.length}
• Потрачено: ${user.orders.reduce((sum, order) => sum + (order.amount || 0), 0)} ₽
• Сэкономлено: ~${Math.floor(Math.random() * 500)} ₽

🎯 Достижения:
${user.orders.length >= 5 ? '✅' : '❌'} Постоянный клиент (5+ заказов)
${user.balance >= 1000 ? '✅' : '❌'} VIP статус (1000+ ₽)
${user.orders.length >= 1 ? '✅' : '❌'} Первая покупка`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🛍️ Сделать заказ', web_app: { url: WEBAPP_URL } }
            ],
            [
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(statsMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, statsMessage, { reply_markup: keyboard });
    });
}

// Функция показа заказов
function showOrders(chatId, user) {
    let ordersMessage = `📋 Ваши заказы\n\n`;

    if (user.orders.length === 0) {
        ordersMessage += `❌ У вас пока нет заказов

🎯 Сделайте первый заказ и получите скидку 10%!`;
    } else {
        user.orders.slice(-5).forEach((order, index) => {
            ordersMessage += `📦 Заказ #${order.id || index + 1}
🛍️ ${order.service || 'Неизвестная услуга'}
💰 ${order.amount || 0} ₽
📅 ${order.date || new Date().toLocaleDateString('ru-RU')}
✅ ${order.status || 'Выполнен'}

`;
        });
    }

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🛍️ Новый заказ', web_app: { url: WEBAPP_URL } }
            ],
            [
                { text: '📞 Поддержка', callback_data: 'support' },
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(ordersMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, ordersMessage, { reply_markup: keyboard });
    });
}

// Функция показа баланса
function showBalance(chatId, user) {
    const balanceMessage = `💰 Ваш баланс

💳 Текущий баланс: ${user.balance} ₽
📈 Потрачено всего: ${user.orders.reduce((sum, order) => sum + (order.amount || 0), 0)} ₽

🎁 Способы пополнения:
• 💳 Банковская карта
• 🪙 Криптовалюта
• 📱 СБП (быстрые платежи)
• 💰 Электронные кошельки

💡 Бонусы:
• При пополнении от 1000₽ - скидка 5%
• При пополнении от 5000₽ - скидка 10%`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '💰 Пополнить баланс', callback_data: 'add_balance' }
            ],
            [
                { text: '🛍️ Перейти в магазин', web_app: { url: WEBAPP_URL } }
            ],
            [
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, balanceMessage, { reply_markup: keyboard });
    });
}

// Функция показа помощи
function showHelp(chatId) {
    const helpMessage = `❓ Помощь KeyFory

🎯 Как сделать заказ:
1. Нажмите "🛍️ Открыть магазин"
2. Выберите нужную категорию
3. Найдите подходящую услугу
4. Заполните форму заказа
5. Дождитесь выполнения

💳 Способы оплаты:
• Банковские карты
• Криптовалюта (BTC, ETH, USDT)
• СБП (Система быстрых платежей)
• Электронные кошельки

⚡ Время выполнения:
• Ключи игр: мгновенно
• Аккаунты стриминга: 5-15 минут
• ПО и лицензии: до 30 минут

🛡️ Гарантии:
• Все товары проверены
• Замена при неработающих ключах
• Возврат в течение 24 часов`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📞 Связаться с поддержкой', callback_data: 'support' }
            ],
            [
                { text: '🛍️ Перейти в магазин', web_app: { url: WEBAPP_URL } }
            ],
            [
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(helpMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, helpMessage, { reply_markup: keyboard });
    });
}

// Функция показа поддержки
function showSupport(chatId) {
    const supportMessage = `📞 Поддержка KeyFory

🕐 Мы работаем 24/7

📱 Способы связи:
• Telegram: @KeyForySupport
• Email: support@keyfory.com
• Чат в приложении

⚡ Среднее время ответа: 5 минут

❓ Частые вопросы:
• Не пришел ключ? Проверьте спам
• Ключ не активируется? Свяжитесь с нами
• Нужна замена? Отправьте скриншот

🎯 Мы поможем с любыми вопросами!`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '💬 Написать в поддержку', url: 'https://t.me/KeyForySupport' }
            ],
            [
                { text: '❓ Помощь', callback_data: 'help' },
                { text: '🔙 Назад', callback_data: 'back_to_menu' }
            ]
        ]
    };

    bot.editMessageText(supportMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, supportMessage, { reply_markup: keyboard });
    });
}

// Функция показа главного меню
function showMainMenu(chatId, user) {
    const welcomeMessage = `🎉 Добро пожаловать в KeyFory, ${user.firstName}!

🔑 Здесь вы можете приобрести:
• Игровые ключи и подписки
• Стриминговые сервисы
• Программное обеспечение
• Социальные сети премиум

💫 Все услуги проверены и гарантированы!`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🛍️ Открыть магазин',
                    web_app: { url: WEBAPP_URL }
                }
            ],
            [
                { text: '👤 Мой профиль', callback_data: 'profile' },
                { text: '📊 Статистика', callback_data: 'stats' }
            ],
            [
                { text: '📋 Мои заказы', callback_data: 'orders' },
                { text: '💰 Баланс', callback_data: 'balance' }
            ],
            [
                { text: '❓ Помощь', callback_data: 'help' },
                { text: '📞 Поддержка', callback_data: 'support' }
            ]
        ]
    };

    bot.editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: arguments[2] || undefined,
        reply_markup: keyboard
    }).catch(() => {
        bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
    });
}

// Обработка текстовых сообщений
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;

        bot.sendMessage(chatId, `💬 Спасибо за сообщение!

Для удобства используйте кнопки меню.
Если нужна помощь - нажмите "📞 Поддержка"

Команды бота:
/start - Главное меню`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🛍️ Открыть магазин',
                            web_app: { url: WEBAPP_URL }
                        }
                    ],
                    [
                        { text: '📞 Поддержка', callback_data: 'support' }
                    ]
                ]
            }
        });
    }
});

// Обработка ошибок
bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling:', error);
});

console.log('🤖 KeyFory бот запущен!');
console.log(`🔗 WebApp URL: ${WEBAPP_URL}`);
console.log('✅ Ожидание сообщений...\n');
