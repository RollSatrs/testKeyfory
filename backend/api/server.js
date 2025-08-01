import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { adminRoute } from './route/RouteAdmin/adminRoute.js'
import { sercesRoute } from './route/RouteAdmin/adminServicesRoute.js'
import { materialRoute } from './route/RouteAdmin/adminMaterialRoute.js'
import { orderRoute } from './route/RouteAdmin/adminOrderRoute.js'
import { executerRoute as adminExecuterRoute } from './route/RouteAdmin/adminExecuterRoute.js'
import adminPricingRoute from './route/RouteAdmin/adminPricingRoute.js'
import adminEarningsRoute from './route/RouteAdmin/adminEarningsRoute.js'
import { executerRoute } from './route/RouteExecuter/executerRoute.js'
import { executerOrderRoute } from './route/RouteExecuter/executerOrderRoute.js'
import { executerMaterialRoute } from './route/RouteExecuter/executerMaterialRoute.js'
import { executerServicesRoute } from './route/RouteExecuter/executerServicesRoute.js'
import executerBotRoute from './route/RouteExecuter/executerBotRoute.js'
import { authMiddleware, authExecuterMiddleware } from './middleware.js'
import { sequelize } from '../database/databaseOn.js'
import { checkInactiveExecuters } from './service/ServiceAdmim/adminExecuterService.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())

// Публичные роуты (НЕ требуют токен)
app.use('/api/admin', adminRoute)
app.use('/api/executer', executerRoute) // маршруты исполнителей (регистрация, вход, профиль)
app.use('/api/executers', executerBotRoute) // новые маршруты для бота исполнителей

// Защищённые роуты для исполнителей (ТРЕБУЮТ токен исполнителя)
app.use('/api/executer/orders', authExecuterMiddleware, executerOrderRoute)
app.use('/api/executer/materials', authExecuterMiddleware, executerMaterialRoute)
app.use('/api/executer/services', authExecuterMiddleware, executerServicesRoute)

// Защищённые роуты для админов (ТРЕБУЮТ токен админа)
app.use('/api/services/admin', authMiddleware, sercesRoute)
app.use('/api/materials/admin', authMiddleware, materialRoute)
app.use('/api/orders/admin', authMiddleware, orderRoute)
app.use('/api/executers/admin', authMiddleware, adminExecuterRoute)
app.use('/api/pricing/admin', authMiddleware, adminPricingRoute)
app.use('/api/earnings/admin', authMiddleware, adminEarningsRoute)

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
      console.log(`📋 Публичные роуты:`);
      console.log(`   - Admin: http://localhost:${PORT}/api/admin/* (login/check/register)`);
      console.log(`   - Executer: http://localhost:${PORT}/api/executer/* (login/check/register/profile)`);
      console.log(`🔒 Защищённые роуты для админов:`);
      console.log(`   - Services: http://localhost:${PORT}/api/services/admin/*`);
      console.log(`   - Materials: http://localhost:${PORT}/api/materials/admin/*`);
      console.log(`   - Orders: http://localhost:${PORT}/api/orders/admin/*`);
      console.log(`   - Executers: http://localhost:${PORT}/api/executers/admin/*`);
      console.log(`🔒 Защищённые роуты для исполнителей:`);
      console.log(`   - Orders: http://localhost:${PORT}/api/executer/orders/*`);
      console.log(`   - Materials: http://localhost:${PORT}/api/executer/materials/*`);
      console.log(`   - Services: http://localhost:${PORT}/api/executer/services/*`);

      // Запускаем фоновый процесс проверки неактивных исполнителей каждые 5 минут
      setInterval(async () => {
        try {
          const updatedCount = await checkInactiveExecuters();
          if (updatedCount > 0) {
            console.log(`⏰ Обновлен статус ${updatedCount} неактивных исполнителей`);
          }
        } catch (error) {
          console.error('❌ Ошибка проверки неактивных исполнителей:', error);
        }
      }, 5 * 60 * 1000); // 5 минут

      console.log('⏰ Фоновый процесс проверки активности исполнителей запущен');
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();