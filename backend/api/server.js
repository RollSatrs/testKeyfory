import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'
import http from 'http'
import websocketServer from '../websocket/websocketServer.js'
import { adminRoute } from './route/RouteAdmin/adminRoute.js'
import { sercesRoute } from './route/RouteAdmin/adminServicesRoute.js'
import { materialRoute } from './route/RouteAdmin/adminMaterialRoute.js'
import { orderRoute } from './route/RouteAdmin/adminOrderRoute.js'
import { executerRoute as adminExecuterRoute } from './route/RouteAdmin/adminExecuterRoute.js'
import adminExecuterLimitsRoute from './route/RouteAdmin/adminExecuterLimitsRoute.js'
import adminActiveServicesRoute from './route/RouteAdmin/adminActiveServicesRoute.js'
import adminPricingRoute from './route/RouteAdmin/adminPricingRoute.js'
import adminEarningsRoute from './route/RouteAdmin/adminEarningsRoute.js'
import adminServiceExecutionsRoute from './route/RouteAdmin/adminServiceExecutionsRoute.js'
import limitApprovalRoutes from './route/RouteAdmin/limitApprovalRoutes.js'
import { executerRoute } from './route/RouteExecuter/executerRoute.js'
import { executerOrderRoute } from './route/RouteExecuter/executerOrderRoute.js'
import { executerMaterialRoute } from './route/RouteExecuter/executerMaterialRoute.js'
import { executerServicesRoute } from './route/RouteExecuter/executerServicesRoute.js'
import executerBotRoute from './route/RouteExecuter/executerBotRoute.js'
import executerBotActiveServicesRoute from './route/RouteExecuter/executerBotActiveServicesRoute.js'
import { authMiddleware, authExecuterMiddleware } from './middleware.js'
import { sequelize } from '../database/databaseOn.js'
import { checkInactiveExecuters } from './service/ServiceAdmim/adminExecuterService.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000
const BASE_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// доверять заголовкам прокси (если сервер за прокси/nginx), чтобы корректно получать IP клиента
app.set('trust proxy', true);

app.use(cors({
  origin: true,       // отражать Origin из запроса — позволит любому хосту/IP обращаться
  credentials: true,  // разрешить куки/Authorization (Access-Control-Allow-Credentials: true)
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
}));
app.options('*', cors());
app.use(express.json())

// Публичные роуты (НЕ требуют токен)
app.use('/api/admin', adminRoute)
app.use('/api/executers-bot', executerBotRoute) // новые маршруты для бота исполнителей - ПЕРВЫМИ!
app.use('/api/executers-bot/active-services', executerBotActiveServicesRoute) // маршруты для системы активных услуг
app.use('/api/executers', executerRoute) // маршруты исполнителей (регистрация, вход, профиль)

// Защищённые роуты для исполнителей (ТРЕБУЮТ токен исполнителя)
app.use('/api/executer/orders', authExecuterMiddleware, executerOrderRoute)
app.use('/api/executer/materials', authExecuterMiddleware, executerMaterialRoute)
app.use('/api/executer/services', authExecuterMiddleware, executerServicesRoute)

// Защищённые роуты для админов (ТРЕБУЮТ токен админа)
app.use('/api/admin/services', authMiddleware, sercesRoute)
app.use('/api/admin/materials', authMiddleware, materialRoute)
app.use('/api/admin/orders', authMiddleware, orderRoute)
app.use('/api/admin/executers', authMiddleware, adminExecuterRoute)
app.use('/api/admin/executer-limits', authMiddleware, adminExecuterLimitsRoute)
app.use('/api/admin/active-services', authMiddleware, adminActiveServicesRoute)
app.use('/api/admin/pricing', authMiddleware, adminPricingRoute)
app.use('/api/admin/earnings', authMiddleware, adminEarningsRoute)
app.use('/api/admin/service-executions', authMiddleware, adminServiceExecutionsRoute)
app.use('/api/admin/limit-approvals', authMiddleware, limitApprovalRoutes)

// Роуты для бота (без middleware)
app.use('/api/pricing/admin', adminPricingRoute)

// Дополнительные роуты для frontend (без /api префикса)
app.use('/admin/earnings', adminEarningsRoute)

app.get('/', (req, res) => {
  res.send('👋 Сервер работает!');
});

// Временный роут для тестирования создания заказа
app.post('/test-create-order', async (req, res) => {
  try {
    console.log('\n🧪 === ТЕСТОВОЕ СОЗДАНИЕ ЗАКАЗА ===');

    const orderData = {
      serviceId: '244',
      executerId: 44,
      orderNumber: '58',
      autoAssignMaterial: true
    };

    console.log('📊 Данные заказа:', orderData);

    const { createServiceExecution } = await import('../service/ServiceExecuter/executerService.js');

    const execution = await createServiceExecution(orderData.serviceId, orderData.executerId, orderData.orderNumber);

    console.log('✅ Заказ создан:', execution.id);

    res.json({
      success: true,
      executionId: execution.id,
      message: 'Тестовый заказ создан успешно'
    });

  } catch (error) {
    console.error('❌ Ошибка тестового создания заказа:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
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

    // Проверяем существование админа
    const { Admin } = await import('../database/dbTables.js');
    const existingAdmin = await Admin.findOne({ where: { telegramId: '521649349' } });
    if (existingAdmin) {
      console.log('✅ Admin already exists for telegramId=521649349');
    } else {
      console.log('⚠️ Admin not found, please create one manually');
    }

  // Запускаем сервер (слушаем на 0.0.0.0 чтобы принимать подключения с любых интерфейсов)
  const server = http.createServer(app);

  // Инициализируем WebSocket сервер
  websocketServer.initialize(server);

  server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`� WebSocket сервер готов к соединениям`);
      console.log(`�📋 Публичные роуты:`);
      console.log(`   - Admin: ${BASE_URL}/api/admin/* (login/check/register)`);
      console.log(`   - Executer: ${BASE_URL}/api/executer/* (login/check/register/profile)`);
      console.log(`🔒 Защищённые роуты для админов:`);
      console.log(`   - Services: ${BASE_URL}/api/admin/services/*`);
      console.log(`   - Materials: ${BASE_URL}/api/admin/materials/*`);
      console.log(`   - Orders: ${BASE_URL}/api/admin/orders/*`);
      console.log(`   - Executers: ${BASE_URL}/api/admin/executers/*`);
      console.log(`🔒 Защищённые роуты для исполнителей:`);
      console.log(`   - Orders: ${BASE_URL}/api/executer/orders/*`);
      console.log(`   - Materials: ${BASE_URL}/api/executer/materials/*`);
      console.log(`   - Services: ${BASE_URL}/api/executer/services/*`);

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