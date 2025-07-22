// Импорт зависимостей
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import fetch from 'node-fetch'

// Загрузка переменных из .env
dotenv.config({ path: 'C:/Users/sarse/Desktop/My/FullProject/testKeyfory/.env' })

// Получаем токен бота из .env (используем другой токен для этого бота)
const token = process.env.ADMINFORGOT;
const telegramId = process.env.TELEGRAMID
console.log('Password Bot Token:', token)

// Проверка наличия токена
if (!token) {
  console.error('❌ PASSWORD_BOT_TOKEN не найден в .env');
  process.exit(1);
}

// Инициализация бота в режиме polling
const bot = new TelegramBot(token, { polling: true });

let userSteps = {}
let resetCodes = {} // Хранилище кодов сброса

console.log('🔐 Бот управления паролями администраторов запущен');

// Ответ на команду /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const userId = String(msg.from.id);

  // Проверяем, зарегистрирован ли этот Telegram ID как админ
  try {
    const res = await fetch('http://localhost:3000/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userId })
    })
    const data = await res.json()

    if (!data.exists) {
      bot.sendMessage(chatId, '⛔️ Ваш Telegram ID не зарегистрирован как администратор.\n\nДля получения доступа обратитесь к главному администратору.')
      return
    }

    bot.sendMessage(
      chatId,
      `🔐 Добро пожаловать в бот управления паролями администраторов!\n\n` +
      `Этот бот предназначен для:\n` +
      `• Смены пароля вашего админ-аккаунта\n` +
      `• Получения кодов сброса пароля\n\n` +
      `Используйте /help для просмотра команд.`
    )
  } catch (err) {
    bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу. Попробуйте позже.')
  }
})

// Команда для смены пароля
bot.onText(/\/change_password/, async (msg) => {
  const chatId = msg.chat.id
  const userId = String(msg.from.id);

  // Проверяем, зарегистрирован ли этот Telegram ID как админ
  try {
    const res = await fetch('http://localhost:3000/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userId })
    })
    const data = await res.json()

    if (!data.exists) {
      bot.sendMessage(chatId, '❌ Ваш Telegram ID не зарегистрирован как администратор!\n\nДля получения доступа обратитесь к главному администратору.')
      return
    }

    // Если админ зарегистрирован, переходим к смене пароля
    userSteps[chatId] = { step: 'change_password', tgId: userId }
    bot.sendMessage(
      chatId,
      `🔒 Смена пароля администратора\n\nВведите новый пароль:`
    )
  } catch (err) {
    bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
  }
})

// Команда помощи
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id
  const userId = String(msg.from.id);

  // Проверяем, зарегистрирован ли этот Telegram ID как админ
  try {
    const res = await fetch('http://localhost:3000/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userId })
    })
    const data = await res.json()

    if (!data.exists) {
      bot.sendMessage(chatId, '⛔️ Ваш Telegram ID не зарегистрирован как администратор.')
      return
    }

    bot.sendMessage(
      chatId,
      `📋 Бот управления паролями администраторов\n\n` +
      `Доступные команды:\n\n` +
      `/change_password - Изменить пароль\n` +
      `/help - Показать это сообщение\n\n` +
      `💡 Для восстановления пароля используйте форму на сайте.`
    )
  } catch (err) {
    bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
  }
})

// Функция для отправки кода сброса (вызывается из backend)
export async function sendResetCode(telegramId, resetCode) {
  try {
    // Проверяем, зарегистрирован ли этот Telegram ID как админ
    const checkRes = await fetch('http://localhost:3000/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: telegramId })
    })
    const checkData = await checkRes.json()

    if (!checkData.exists) {
      console.log(`❌ Telegram ID ${telegramId} не найден в базе администраторов`);
      return false; // Возвращаем false если админ не найден
    }

    // Сохраняем код для этого пользователя
    resetCodes[telegramId] = {
      code: resetCode,
      timestamp: Date.now(),
      expires: Date.now() + 10 * 60 * 1000 // 10 минут
    }

    await bot.sendMessage(telegramId,
      `🔐 Код для сброса пароля админ-панели: \`${resetCode}\`\n\n` +
      `Код действителен 10 минут.\n` +
      `Если вы не запрашивали сброс пароля, проигнорируйте это сообщение.\n\n` +
      `Введите этот код на странице восстановления пароля.`,
      { parse_mode: 'Markdown' }
    );

    console.log(`✅ Код сброса отправлен администратору ${telegramId}`);
    return true; // Возвращаем true если код успешно отправлен
  } catch (error) {
    console.error('❌ Ошибка отправки кода сброса:', error);
    return false; // Возвращаем false при ошибке
  }
}

bot.on('message', async(msg) => {
  const chatId = msg.chat.id
  const text = msg.text
  const userId = String(msg.from.id);

  // Пропускаем команды, они уже обработаны выше
  if (text.startsWith('/')) return

  // Проверяем, зарегистрирован ли этот Telegram ID как админ (для всех действий)
  try {
    const res = await fetch('http://localhost:3000/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userId })
    })
    const data = await res.json()

    if (!data.exists) {
      bot.sendMessage(chatId, '⛔️ Ваш Telegram ID не зарегистрирован как администратор.')
      return
    }
  } catch (err) {
    bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
    return
  }

  // Обработка смены пароля
  if (userSteps[chatId] && userSteps[chatId].step === 'change_password') {
    const tgId = userSteps[chatId].tgId
    const newPassword = text

    try {
      // Отправляем запрос на смену пароля
      const res = await fetch('http://localhost:3000/api/admin/admin-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgId,
          newPassword: newPassword
        })
      })

      if (res.ok) {
        bot.sendMessage(chatId, '✅ Пароль успешно изменен!')
      } else {
        const data = await res.json()
        bot.sendMessage(chatId, `❌ Ошибка: ${data.error || 'Не удалось изменить пароль'}`)
      }
    } catch (e) {
      bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу.')
    }

    userSteps[chatId] = null
    return
  }

  // Если нет активного диалога
  if (!userSteps[chatId]) {
    bot.sendMessage(chatId, 'Используйте /help для просмотра доступных команд.')
  }
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('❌ Ошибка бота управления паролями:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling бота управления паролями:', error);
});
