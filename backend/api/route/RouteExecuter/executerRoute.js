import express from 'express'
import {
  addExecuter,
  checkExecuter,
  loginExecuter,
  getExecuterProfile,
  updateExecuterProfile,
  updateExecuterStatus
} from '../../service/ServiceExecuter/executerService.js'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
import { authExecuterMiddleware } from '../../middleware.js';

export const executerRoute = express.Router()

dotenv.config();

// ПУБЛИЧНЫЕ МАРШРУТЫ (без авторизации)

// Регистрация нового исполнителя
executerRoute.post('/register', async (req, res) => {
  try {
    const { telegramId, name } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }

    console.log('Регистрация исполнителя:', telegramId, name);
    const executer = await addExecuter(telegramId, name);

    res.status(201).json({
      success: true,
      message: 'Исполнитель успешно зарегистрирован',
      executer: {
        id: executer.id,
        telegram_id: executer.telegram_id,
        name: executer.name,
        status: executer.status
      }
    });
  } catch (err) {
    console.error('Ошибка регистрации исполнителя:', err.message);

    if (err.message === 'Не указан telegram_id') {
      return res.status(400).json({ error: 'Не указан telegram_id' });
    }
    if (err.message === 'Исполнитель с таким Telegram ID уже существует') {
      return res.status(409).json({ error: 'Исполнитель с таким Telegram ID уже существует' });
    }

    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка существования исполнителя
executerRoute.post('/check', async(req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID не указан' });
    }

    const executer = await checkExecuter(telegramId);

    if (executer) {
      return res.json({
        exists: true,
        executer: {
          id: executer.id,
          telegram_id: executer.telegram_id,
          name: executer.name,
          status: executer.status,
          rating: executer.rating
        }
      });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('Ошибка проверки исполнителя:', err.message);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Авторизация исполнителя (без пароля, только по Telegram ID)
executerRoute.post('/login', async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID обязателен" });
    }

    const executer = await loginExecuter(telegramId);

    // Создаем токен с 30-дневным сроком действия для исполнителя
    const token = jwt.sign(
      {
        telegramId,
        type: 'executer',
        executerId: executer.id
      },
      process.env.JWT_SECRET_EXECUTER,
      { expiresIn: '30d' }
    );

    // Обновляем статус исполнителя на "активен"
    await updateExecuterStatus(telegramId, 'active');

    console.log(`✅ Токен создан для исполнителя: ${telegramId}`);
    res.json({
      success: true,
      token,
      executer: {
        id: executer.id,
        telegram_id: executer.telegram_id,
        name: executer.name,
        status: 'active',
        rating: executer.rating
      }
    });
  } catch (err) {
    console.error('Ошибка входа исполнителя:', err.message);

    if (err.message === 'Исполнитель не найден') {
      return res.status(404).json({ error: "Исполнитель не найден" });
    }
    if (err.message === 'Аккаунт исполнителя заблокирован') {
      return res.status(403).json({ error: "Аккаунт исполнителя заблокирован" });
    }

    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют авторизации)

// Получение профиля исполнителя
executerRoute.get('/profile', authExecuterMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    const profile = await getExecuterProfile(telegramId);

    res.json({
      success: true,
      profile: {
        id: profile.id,
        telegram_id: profile.telegram_id,
        name: profile.name,
        rating: profile.rating,
        status: profile.status,
        created_at: profile.create_date_executer
      }
    });
  } catch (err) {
    console.error('Ошибка получения профиля:', err.message);

    if (err.message === 'Исполнитель не найден') {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля исполнителя
executerRoute.put('/profile', authExecuterMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    const updateData = req.body;

    const updatedProfile = await updateExecuterProfile(telegramId, updateData);

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      profile: {
        id: updatedProfile.id,
        telegram_id: updatedProfile.telegram_id,
        name: updatedProfile.name,
        rating: updatedProfile.rating,
        status: updatedProfile.status,
        created_at: updatedProfile.create_date_executer
      }
    });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err.message);

    if (err.message === 'Исполнитель не найден') {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }
    if (err.message === 'Нет данных для обновления') {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление статуса исполнителя
executerRoute.put('/status', authExecuterMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Статус обязателен' });
    }

    const updatedProfile = await updateExecuterStatus(telegramId, status);

    res.json({
      success: true,
      message: 'Статус успешно обновлен',
      profile: {
        id: updatedProfile.id,
        telegram_id: updatedProfile.telegram_id,
        name: updatedProfile.name,
        rating: updatedProfile.rating,
        status: updatedProfile.status,
        created_at: updatedProfile.create_date_executer
      }
    });
  } catch (err) {
    console.error('Ошибка обновления статуса:', err.message);

    if (err.message === 'Исполнитель не найден') {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }
    if (err.message === 'Недопустимый статус') {
      return res.status(400).json({ error: 'Недопустимый статус. Доступные: active, inactive, busy, blocked' });
    }

    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выход из системы
executerRoute.post('/logout', authExecuterMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    // Обновляем статус исполнителя на "неактивен"
    await updateExecuterStatus(telegramId, 'inactive');

    console.log(`✅ Исполнитель ${telegramId} вышел из системы`);
    res.json({
      success: true,
      message: 'Успешный выход из системы'
    });
  } catch (err) {
    console.error('Ошибка при выходе:', err.message);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка валидности токена исполнителя
executerRoute.get('/verify', authExecuterMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    const profile = await getExecuterProfile(telegramId);

    res.json({
      valid: true,
      user: {
        telegramId: req.user.telegramId,
        type: req.user.type,
        executerId: req.user.executerId
      },
      profile: {
        id: profile.id,
        telegram_id: profile.telegram_id,
        name: profile.name,
        rating: profile.rating,
        status: profile.status
      }
    });
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message);
    res.status(401).json({ valid: false, error: 'Токен недействителен' });
  }
});