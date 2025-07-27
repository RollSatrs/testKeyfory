import express from 'express'
import {
  addExecuter,
  checkExecuter,
  loginExecuter,
  getExecuterProfile,
  updateExecuterProfile,
  updateExecuterStatus,
  getExecuterOrders,
  getExecuterServices,
  getExecuterStats,
  getExecuterBalance,
  getOrderById,
  getMaterialsByOrder,
  completeOrder,
  startOrderWork,
  acceptOrder,
  requestMaterialReplacement,
  writeExecuterLog,
  updateExecuterActivity,
  createExecuterLog
} from '../../service/ServiceExecuter/executerService.js'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
import { authExecuterMiddleware } from '../../middleware.js';

export const executerRoute = express.Router()

dotenv.config();

// ПУБЛИЧНЫЕ МАРШРУТЫ (без авторизации)

// Авторизация для бота
executerRoute.post('/auth', async (req, res) => {
  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }

    const executer = await checkExecuter(telegram_id);

    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    if (executer.status === 'blocked') {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    res.json({
      id: executer.id,
      name: executer.name,
      telegram_id: executer.telegram_id,
      balance: executer.balance,
      rating: executer.rating
    });
  } catch (error) {
    console.error('Ошибка авторизации исполнителя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить заказы исполнителя
executerRoute.get('/orders/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const orders = await getExecuterOrders(executerId);
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить выполненные заказы исполнителя
executerRoute.get('/completed-orders/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const orders = await getExecuterOrders(executerId, 'completed');
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения выполненных заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить доступные услуги для исполнителя
executerRoute.get('/services/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const services = await getExecuterServices(executerId);
    res.json(services);
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику исполнителя
executerRoute.get('/stats/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const stats = await getExecuterStats(executerId);
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить баланс исполнителя
executerRoute.get('/balance/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const balance = await getExecuterBalance(executerId);
    res.json({ balance });
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить информацию о заказе
executerRoute.get('/order/:orderId/:executerId', async (req, res) => {
  try {
    const { orderId, executerId } = req.params;
    const order = await getOrderById(orderId, executerId);
    res.json(order);
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить материалы по заказу
executerRoute.get('/materials/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🔍 API запрос материалов для заказа: ${orderId}`);

    const materials = await getMaterialsByOrder(orderId);
    console.log(`📦 API возвращает ${materials.length} материалов`);

    res.json(materials);
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Завершить заказ
executerRoute.post('/complete-order', async (req, res) => {
  try {
    const { order_id, executer_id } = req.body;
    const result = await completeOrder(order_id, executer_id);
    res.json(result);
  } catch (error) {
    console.error('Ошибка завершения заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Начать работу над заказом
executerRoute.post('/start-order', async (req, res) => {
  try {
    const { order_id, executer_id } = req.body;
    const result = await startOrderWork(order_id, executer_id);
    res.json(result);
  } catch (error) {
    console.error('Ошибка начала работы над заказом:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Принять заказ в работу
executerRoute.post('/accept-order', async (req, res) => {
  try {
    const { order_id, executer_id } = req.body;
    const result = await acceptOrder(order_id, executer_id);
    res.json(result);
  } catch (error) {
    console.error('Ошибка принятия заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить активность исполнителя
executerRoute.post('/activity', async (req, res) => {
  try {
    const { executer_id } = req.body;
    const result = await updateExecuterActivity(executer_id);
    res.json({ success: true, message: 'Активность обновлена' });
  } catch (error) {
    console.error('Ошибка обновления активности:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать лог действия
executerRoute.post('/log', async (req, res) => {
  try {
    const { user_id, action, description, order_id, service_id } = req.body;
    const result = await createExecuterLog(user_id, action, description, order_id, service_id);
    res.json({ success: true, message: 'Лог создан' });
  } catch (error) {
    console.error('Ошибка создания лога:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запросить замену материала
executerRoute.post('/request-replacement', async (req, res) => {
  try {
    const { order_id, executer_id, reason } = req.body;
    const result = await requestMaterialReplacement(order_id, executer_id, reason);
    res.json(result);
  } catch (error) {
    console.error('Ошибка запроса замены:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Записать лог
executerRoute.post('/log', async (req, res) => {
  try {
    const { user_id, user_type, action, description, order_id, service_id } = req.body;
    const result = await writeExecuterLog(user_id, user_type, action, description, order_id, service_id);
    res.json(result);
  } catch (error) {
    console.error('Ошибка записи лога:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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