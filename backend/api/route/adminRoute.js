import express from 'express'
import { addAdmin, checkAdmin, login } from '../service/adminService.js'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Admin } from '../../database/dbTables.js'

export const adminRoute = express.Router()

dotenv.config();

// Middleware для проверки JWT токена
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

adminRoute.post('/add', async (req, res) => {
  try {
    const { telegramId, passwordHash } = req.body
    console.log(telegramId, passwordHash)
    await addAdmin(telegramId, passwordHash)
    res.status(201).json({ message: 'админ был успешно создан' })
  } catch (err) {
    if(err.message === 'Не указан telegram_id или password_hash'){
      return res.status(400).json({ error: 'Не указан telegram_id или password_hash' })
    }
    if(err.message === 'Ошибка сревера'){
      return res.status(500).json({ error: 'Ошибка сервера' })
    }

  }
})

adminRoute.post('/check', async(req, res) =>{
  try{
    const {telegramId} = req.body
    const admin = await checkAdmin(telegramId)
    if (admin) {
      return res.json({ exists: true })
    } else {
      return res.json({ exists: false })
    }
  }catch(err){
    if (err.message === 'Админ не найден') {
      return res.json({ exists: false })
    }
    if (err.message === 'Ошибка сревера') {
      return res.status(500).json({ error: 'Ошибка сервера' })
    }
    return res.status(500).json({ error: err.message })
  }
})

adminRoute.post('/login', async (req, res) =>{
  try{
    const {telegramId, password} = req.body

    if (!telegramId || !password) {
      return res.status(400).json({error: "Telegram ID и пароль обязательны"})
    }

    const admin = await login(telegramId, password)
    const token = jwt.sign({ telegramId }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log(`✅ Токен создан для админа: ${telegramId}`)
    res.json({token})
  }catch(err){
    console.error('Ошибка входа:', err.message);
    if(err.message === 'Нет такого админа') return res.status(400).json({error: "Нет такого админа"})
    if(err.message === 'Неверный пароль') return res.status(401).json({error: "Неверный пароль"})
    return res.status(500).json({error: "Ошибка сервера"})
  }
})

adminRoute.post('forgot-password', async (req, res) => {
    try {
        const { telegramId } = req.body;
        if (!telegramId) {
            return res.status(400).json({ error: 'Телеграм ID не указан' });
        }
        // Здесь должна быть логика для сброса пароля
        res.json({ message: 'Ссылка для сброса пароля отправлена в вашем Telegram' });
    } catch (error) {
        console.error('Ошибка при сбросе пароля:', error);
        res.status(500).json({ error: error.message });
    }
})

// Роут для проверки существования админа и разрешения смены пароля
adminRoute.post('/check-for-reset', async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID не указан' });
    }

    const admin = await checkAdmin(telegramId);

    if (admin) {
      res.json({ exists: true, message: 'Администратор найден. Можете изменить пароль.' });
    } else {
      res.status(404).json({ exists: false, error: 'Администратор с таким Telegram ID не найден' });
    }
  } catch (err) {
    console.error('Ошибка при проверке админа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для простой смены пароля (без кодов)
adminRoute.post('/simple-reset-password', async (req, res) => {
  try {
    const { telegramId, newPassword } = req.body;

    if (!telegramId || !newPassword) {
      return res.status(400).json({ error: 'Telegram ID и новый пароль обязательны' });
    }

    // Проверяем, существует ли админ
    const admin = await Admin.findOne({ where: { telegramId } });

    if (!admin) {
      return res.status(404).json({ error: 'Администратор не найден' });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await Admin.update(
      { password: hashedPassword },
      { where: { telegramId } }
    );

    console.log(`✅ Пароль изменен для администратора ${telegramId}`);
    res.json({ success: true, message: 'Пароль успешно изменен!' });
  } catch (err) {
    console.error('Ошибка при смене пароля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для проверки валидности токена (защищенный)
adminRoute.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({ valid: true, user: req.user });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Токен недействителен' });
  }
});