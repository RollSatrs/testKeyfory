import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { adminRoute } from './route/adminRoute.js'
import { sercesRoute } from './route/servicesRoute.js'
import { materialRoute } from './route/materialRoute.js'
import { orderRoute } from './route/orderRoute.js'
import { executerRoute } from './route/executerRoute.js' 
import { authMiddleware } from './middleware.js'
import { sequelize } from '../database/databaseOn.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())

// Публичные роуты (НЕ требуют токен)
app.use('/api/admin', adminRoute)

// Защищённые роуты (ТРЕБУЮТ токен)
app.use('/api/services', authMiddleware, sercesRoute)
app.use('/api/materials', authMiddleware, materialRoute)
app.use('/api/orders', authMiddleware, orderRoute)
app.use('/api/executers', authMiddleware, executerRoute) // изменён путь и переменная

app.get('/', (req, res) => {
  res.send('👋 Сервер работает!');
});

// Функция запуска сервера с инициализацией БД
const startServer = async () => {
  try {
    // Проверяем подключение к базе данных
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Синхронизируем модели с базой данных (НЕ пересоздаем таблицы)
    await sequelize.sync({ alter: true });
    console.log('✅ Схема базы данных синхронизирована');

    // Убираем заполнение фейковыми данными

    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📋 Роуты:`);
      console.log(`   - Admin: http://localhost:${PORT}/api/admin/* (login/check публичные, add защищён)`);
      console.log(`🔒 Защищённые роуты:`);
      console.log(`   - Services: http://localhost:${PORT}/api/services/*`);
      console.log(`   - Materials: http://localhost:${PORT}/api/materials/*`);
      console.log(`   - Orders: http://localhost:${PORT}/api/orders/*`);
      console.log(`   - Executers: http://localhost:${PORT}/api/executers/*`);
      console.log(`   - Users: http://localhost:${PORT}/api/users/*`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();