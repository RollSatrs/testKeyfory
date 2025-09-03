import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Простой путь к общему .env файлу в корне проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Идем на 1 уровень вверх: bot -> testKeyfory
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log(`📄 [bot/index.js] Использую .env файл: ${envPath}`);
dotenv.config({ path: envPath });
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const token = process.env.EXECUTER_BOT_TOKEN; // Исправлено имя переменной
const telegramId = process.env.ADMIN_TELEGRAM_ID; // Исправлено имя переменной

if (!token) {
  console.error('❌ EXECUTER_BOT_TOKEN не найден в .env');
  process.exit(1);
}
Й
const bot = new Telegraf(token);

let userSteps = {};

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  userSteps[chatId] = { step: 'id' };
  ctx.reply(
    `👋 Добро пожаловать!\n\nДля создания профиля администратора, пожалуйста, отправьте свой Telegram ID.\n\nНапример:\n123456789`
  );
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const userId = String(ctx.from.id);

  // Проверка доступа
  if (telegramId !== userId) {
    ctx.reply('⛔️ Доступ к боту запрещен');
    return;
  }

  // Пропускаем /start, оно уже обработано выше
  if (text === '/start') return;

  // Пошаговая логика
  if (!userSteps[chatId]) {
    userSteps[chatId] = { step: 'id' };
    ctx.reply('Пожалуйста, отправьте свой Telegram ID.');
    return;
  }

  if (userSteps[chatId].step === 'id') {
    if (!/^\d+$/.test(text)) {
      ctx.reply('❗️ Пожалуйста, отправьте корректный Telegram ID (только цифры).');
      return;
    }

    // Проверяем наличие админа
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: text })
      });
      const data = await res.json();
      if (data.exists) {
        ctx.reply('⚠️ Админ с таким Telegram ID уже существует!');
        userSteps[chatId] = null;
        return;
      }
    } catch (err) {
      ctx.reply('❌ Не удалось подключиться к серверу.');
      userSteps[chatId] = null;
      return;
    }
    // Если не найден — продолжаем регистрацию
    userSteps[chatId] = { step: 'password', tgId: text };
    ctx.reply(
      `✅ Telegram ID получен!\n\nТеперь отправьте пароль для профиля администратора.\n\n🔒 Пароль будет зашифрован и отправлен через API для сохранения в базе данных (таблица admin).\n\n⚠️ Не сообщайте свой пароль никому!`
    );
    return;
  }

  if (userSteps[chatId].step === 'password') {
    const tgId = userSteps[chatId].tgId;
    const password = text;
    const hash = await bcrypt.hash(password, 10);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: tgId, passwordHash: hash })
      });
      if (res.ok) {
        ctx.reply('✅ Ваши данные отправлены для создания профиля администратора!');
      } else {
        ctx.reply('❌ Ошибка при сохранении данных. Попробуйте позже.');
      }
    } catch (e) {
      ctx.reply('❌ Не удалось подключиться к серверу.');
    }
    userSteps[chatId] = null;
    return;
  }
});

bot.launch();
