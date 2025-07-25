import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' });

const token = process.env.EXECUTER_BOT_TOKEN;
console.log('token', token);
const webAppUrl = process.env.WEBAPP_EXECUTER_URL;


if (!token) {
    console.error('TELEGRAM_BOT_TOKEN не найден в .env файле');
    process.exit(1);
}

const bot = new Telegraf(token);

// Устанавливаем кнопку меню для всех пользователей
bot.telegram.callApi('setChatMenuButton', {
    menu_button: {
        type: 'web_app',
        text: 'Open',
        web_app: {
            url: webAppUrl
        }
    }
});

bot.start((ctx) => {
    ctx.reply(
        'Для работы используйте кнопку ниже:',
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Open',
                            web_app: { url: webAppUrl }
                        }
                    ]
                ]
            }
        }
    );
});

bot.launch();
console.log('Telegraf executer bot запущен!', webAppUrl);
// console.log('webAppUrl', webAppUrl);
