import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { adminRoute } from './route/RouteAdmin/adminRoute.js'
import { sercesRoute } from './route/RouteAdmin/adminServicesRoute.js'
import { materialRoute } from './route/RouteAdmin/adminMaterialRoute.js'
import { orderRoute } from './route/RouteAdmin/adminOrderRoute.js'
import { executerRoute } from './route/RouteAdmin/adminExecuterRoute.js'
import { authMiddleware, authExecuterMiddleware } from './middleware.js'
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
app.use('api/executer/', executerRoute) // изменён путь

// Защищённые роуты (ТРЕБУЮТ токен)

app.use('/api/services/executer', authExecuterMiddleware, sercesRoute) // изменён путь и переменная

app.use('/api/services/admin', authMiddleware, sercesRoute)
app.use('/api/materials/admin', authMiddleware, materialRoute)
app.use('/api/orders/admin', authMiddleware, orderRoute)
app.use('/api/executers/admin', authMiddleware, executerRoute) // изменён путь и переменная

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
      console.log(`   - Services: http://localhost:${PORT}/api/services/admin*`);
      console.log(`   - Materials: http://localhost:${PORT}/api/materials/admin*`);
      console.log(`   - Orders: http://localhost:${PORT}/api/orders/admin*`);
      console.log(`   - Executers: http://localhost:${PORT}/api/executers/admin/*`);
      console.log(`   - Users: http://localhost:${PORT}/api/users/*`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();