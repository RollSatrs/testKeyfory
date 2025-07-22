import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Загрузка переменных из .env
dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' });

// Получаем токен бота из .env
const token = process.env.ADMINBOT;
const bot = new TelegramBot(token);

export async function sendOrderNotificationToPerformer(performerTelegramId, orderData) {
    try {
        if (!performerTelegramId || !orderData) {
            throw new Error('Performer Telegram ID and order data are required');
        }

        const message = `
🔔 Новый заказ назначен на вас!

📋 Детали заказа:
• ID: #${orderData.id}
• Услуга: ${orderData.service_name}
• Статус: ${orderData.status}
• Сумма: ${orderData.price} руб.
${orderData.details ? `• Детали: ${orderData.details}` : ''}

💼 Пожалуйста, проверьте мини-приложение для выполнения заказа.
        `;

        await bot.sendMessage(performerTelegramId, message);
        console.log(`✅ Уведомление отправлено исполнителю ${performerTelegramId}`);

        return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
        console.error('❌ Ошибка отправки уведомления:', error.message);
        throw new Error(`Error sending notification: ${error.message}`);
    }
}

export async function sendOrderUpdateNotificationToPerformer(performerTelegramId, orderData, updateType = 'updated') {
    try {
        if (!performerTelegramId || !orderData) {
            throw new Error('Performer Telegram ID and order data are required');
        }

        let message;

        switch (updateType) {
            case 'status_changed':
                message = `
🔄 Статус заказа изменен!

📋 Заказ #${orderData.id}
• Услуга: ${orderData.service_name}
• Новый статус: ${orderData.status}
• Сумма: ${orderData.price} руб.

💼 Проверьте мини-приложение для актуальной информации.
                `;
                break;
            case 'updated':
                message = `
✏️ Заказ обновлен!

📋 Заказ #${orderData.id}
• Услуга: ${orderData.service_name}
• Статус: ${orderData.status}
• Сумма: ${orderData.price} руб.
${orderData.details ? `• Детали: ${orderData.details}` : ''}

💼 Проверьте мини-приложение для актуальной информации.
                `;
                break;
            default:
                message = `
📋 Обновление по заказу #${orderData.id}
• Услуга: ${orderData.service_name}
• Статус: ${orderData.status}
• Сумма: ${orderData.price} руб.
                `;
        }

        await bot.sendMessage(performerTelegramId, message);
        console.log(`✅ Уведомление об обновлении отправлено исполнителю ${performerTelegramId}`);

        return { success: true, message: 'Update notification sent successfully' };
    } catch (error) {
        console.error('❌ Ошибка отправки уведомления об обновлении:', error.message);
        throw new Error(`Error sending update notification: ${error.message}`);
    }
}
