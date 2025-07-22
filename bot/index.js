// Импорт зависимостей
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import fetch from 'node-fetch'

// Загрузка переменных из .env
dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' })

// Получаем токен бота из .env
const token = process.env.ADMINBOT;
const telegramId = process.env.TELEGRAMID
console.log(token)
// Проверка наличия токена
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env');
  process.exit(1);
}

// Инициализация бота в режиме polling
const bot = new TelegramBot(token, { polling: true });

let userSteps = {}

// Ответ на команду /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  userSteps[chatId] = { step: 'id' }
  bot.sendMessage(
    chatId,
    `👋 Добро пожаловать!\n\nДля создания профиля администратора, пожалуйста, отправьте свой Telegram ID.\n\nНапример:\n123456789`
  )
})

bot.on('message', async(msg) => {
  const chatId = msg.chat.id
  const text = msg.text
  const userId = String(msg.from.id);

  // Проверка доступа
  if (telegramId !== userId) {
    bot.sendMessage(chatId, '⛔️ Доступ к боту запрещен')
    return
  }

  // Пропускаем /start, оно уже обработано выше
  if (text === '/start') return

  // Пошаговая логика
  if (!userSteps[chatId]) {
    userSteps[chatId] = { step: 'id' }
    bot.sendMessage(chatId, 'Пожалуйста, отправьте свой Telegram ID.')
    return
  }
  console.log('userSteps:', userSteps[chatId]);
  if (userSteps[chatId].step === 'id') {
    if (!/^\d+$/.test(text)) {
      bot.sendMessage(chatId, '❗️ Пожалуйста, отправьте корректный Telegram ID (только цифры).')
      return
    }

    // Проверяем наличие админа
    try {
      const res = await fetch('http://localhost:3000/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: text })
      })
      const data = await res.json()
      if (data.exists) {
        bot.sendMessage(chatId, '⚠️ Админ с таким Telegram ID уже существует!')
        userSteps[chatId] = null
        return
      }
    } catch (err) {
      bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
      userSteps[chatId] = null
      return
    }
    // Если не найден — продолжаем регистрацию
    userSteps[chatId] = { step: 'password', tgId: text }
    bot.sendMessage(
      chatId,
      `✅ Telegram ID получен!\n\nТеперь отправьте пароль для профиля администратора.\n\n🔒 Пароль будет зашифрован и отправлен через API для сохранения в базе данных (таблица admin).\n\n⚠️ Не сообщайте свой пароль никому!`
    )
    return
  }

  if (userSteps[chatId].step === 'password') {
    const tgId = userSteps[chatId].tgId
    const password = text
    // Хэшируем пароль правильно!
    const hash = await bcrypt.hash(password, 10)
    // Делаем запрос на backend
    try {
      const res = await fetch('http://localhost:3000/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: tgId, passwordHash: hash })
      })
      if (res.ok) {
        bot.sendMessage(chatId, '✅ Ваши данные отправлены для создания профиля администратора!')
      } else {
        bot.sendMessage(chatId, '❌ Ошибка при сохранении данных. Попробуйте позже.')
      }
    } catch (e) {
      bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
    }
    userSteps[chatId] = null
    return
  }
});
