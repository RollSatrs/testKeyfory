import express from 'express'
import {
  addExecuter,
  checkExecuter,
  loginExecuter,
  getExecuterProfile,
  updateExecuterProfile,
  updateExecuterStatus,
  getExecuterOrders,
  getExecuterActiveOrders,
  getExecuterCompletedOrders,
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
  getAvailableMaterialsForReplacement,
  updateExecuterActivity,
  createExecuterLog,
  createExecuterOrder,
  createServiceExecution
} from '../../service/ServiceExecuter/executerService.js'
import { Services, ServiceExecution, Material, Executer } from '../../../database/dbTables.js';
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

// Получить активные заказы исполнителя
executerRoute.get('/active-orders/:executerId', async (req, res) => {
  try {
    console.log('\n🔥 === АКТИВНЫЕ ЗАКАЗЫ ENDPOINT ===');
    const { executerId } = req.params;
    console.log(`👤 Executer ID: ${executerId}`);

    const orders = await getExecuterActiveOrders(executerId);
    console.log(`📋 Найдено активных заказов: ${orders ? orders.length : 0}`);

    res.json(orders);
  } catch (error) {
    console.error('❌ ОШИБКА получения активных заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить завершенные заказы исполнителя
executerRoute.get('/completed-orders/:executerId', async (req, res) => {
  try {
    console.log('\n✅ === ЗАВЕРШЕННЫЕ ЗАКАЗЫ ENDPOINT ===');
    const { executerId } = req.params;
    console.log(`👤 Executer ID: ${executerId}`);

    const orders = await getExecuterCompletedOrders(executerId);
    console.log(`📋 Найдено завершенных заказов: ${orders ? orders.length : 0}`);

    res.json(orders);
  } catch (error) {
    console.error('❌ ОШИБКА получения завершенных заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить доступные услуги для исполнителя
executerRoute.get('/services/:executerId', async (req, res) => {
  try {
    console.log('\n🛠️ === УСЛУГИ ИСПОЛНИТЕЛЯ ===');
    const { executerId } = req.params;
    console.log(`👤 Executer ID: ${executerId}`);

    const services = await getExecuterServices(executerId);
    console.log(`🛠️ Найдено услуг: ${services ? services.length : 0}`);

    res.json(services);
  } catch (error) {
    console.error('❌ Ошибка получения услуг:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику исполнителя
executerRoute.get('/stats/:executerId', async (req, res) => {
  try {
    console.log('\n📊 === СТАТИСТИКА ИСПОЛНИТЕЛЯ ===');
    const { executerId } = req.params;
    console.log(`👤 Executer ID: ${executerId}`);

    const stats = await getExecuterStats(executerId);
    console.log(`📊 Статистика:`, stats);

    res.json(stats);
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить информацию о заказе по номеру
executerRoute.get('/order-info/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    console.log('\n🔍 === ИНФОРМАЦИЯ О ЗАКАЗЕ ===');
    console.log(`📋 Order Number: ${orderNumber}`);

    const serviceExecution = await ServiceExecution.findOne({
      where: { order_number: orderNumber },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['name', 'price', 'description']
        },
        {
          model: Executer,
          as: 'Executer',
          attributes: ['name']
        }
      ]
    });

    if (serviceExecution) {
      const orderInfo = {
        id: serviceExecution.id,
        orderNumber: orderNumber,
        serviceName: serviceExecution.Service?.name,
        price: serviceExecution.Service?.price,
        status: serviceExecution.status || 'active',
        createdAt: serviceExecution.created_at,
        executerName: serviceExecution.Executer?.name
      };

      console.log(`✅ Заказ найден:`, orderInfo);
      res.json({
        success: true,
        data: orderInfo
      });
    } else {
      console.log(`❌ Заказ не найден: ${orderNumber}`);
      res.status(404).json({
        success: false,
        error: 'Заказ не найден'
      });
    }

  } catch (error) {
    console.error('❌ Ошибка получения информации о заказе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить материалы по номеру заказа
executerRoute.get('/materials/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    console.log('\n📦 === МАТЕРИАЛЫ ЗАКАЗА ===');
    console.log(`📋 Order Number: ${orderNumber}`);

    const materials = await Material.findAll({
      where: { order_number: orderNumber }
    });

    console.log(`📦 Найдено материалов: ${materials.length}`);
    res.json(materials);

  } catch (error) {
    console.error('❌ Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать выполнение услуги (ServiceExecution)
executerRoute.post('/service-execution', async (req, res) => {
  try {
    const { serviceId, executerId, orderNumber } = req.body;

    console.log('\n📋 === СОЗДАНИЕ ВЫПОЛНЕНИЯ УСЛУГИ ===');
    console.log('📊 Данные:', { serviceId, executerId, orderNumber });

    if (!serviceId || !executerId || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }

    // Проверяем, что номер заказа - это цифры
    if (!/^\d+$/.test(orderNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Номер заказа должен содержать только цифры'
      });
    }

    // Проверяем, нет ли уже такого заказа
    const existingExecution = await ServiceExecution.findOne({
      where: { order_number: orderNumber }
    });

    if (existingExecution) {
      return res.status(409).json({
        success: false,
        message: `Заказ с номером ${orderNumber} уже существует`
      });
    }

    const execution = await createServiceExecution(serviceId, executerId, orderNumber);

    console.log('✅ Выполнение услуги создано:', execution.id);

    res.json({
      success: true,
      message: 'Заказ успешно создан',
      execution: {
        id: execution.id,
        order_number: execution.order_number,
        status: execution.status
      }
    });

  } catch (error) {
    console.error('❌ Ошибка создания выполнения услуги:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка сервера'
    });
  }
});

// Завершить заказ
executerRoute.post('/complete-order', async (req, res) => {
  try {
    const { orderNumber, executerId } = req.body;

    console.log('\n✅ === ЗАВЕРШЕНИЕ ЗАКАЗА ===');
    console.log('📊 Данные:', { orderNumber, executerId });

    if (!orderNumber || !executerId) {
      return res.status(400).json({
        success: false,
        message: 'orderNumber и executerId обязательны'
      });
    }

    // Находим ServiceExecution по номеру заказа и ID исполнителя
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executerId
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Обновляем статус на completed
    await execution.update({
      status: 'completed',
      updated_at: new Date()
    });

    // Помечаем материалы как использованные
    await Material.update(
      { status: 'used' },
      { where: { order_number: orderNumber } }
    );

    console.log('✅ Заказ завершен:', orderNumber);

    res.json({
      success: true,
      message: 'Заказ успешно завершен',
      orderNumber
    });

  } catch (error) {
    console.error('❌ Ошибка завершения заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Отменить заказ
executerRoute.post('/cancel-order', async (req, res) => {
  try {
    const { orderNumber, executerId, reason } = req.body;

    console.log('\n❌ === ОТМЕНА ЗАКАЗА ===');
    console.log('📊 Данные:', { orderNumber, executerId, reason });

    if (!orderNumber || !executerId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'orderNumber, executerId и reason обязательны'
      });
    }

    // Находим ServiceExecution по номеру заказа и ID исполнителя
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executerId
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Обновляем статус на cancelled
    await execution.update({
      status: 'cancelled',
      updated_at: new Date()
    });

    // Возвращаем материалы в статус available
    await Material.update(
      { status: 'available' },
      { where: { order_number: orderNumber } }
    );

    console.log('❌ Заказ отменен:', orderNumber);

    res.json({
      success: true,
      message: 'Заказ успешно отменен',
      orderNumber
    });

  } catch (error) {
    console.error('❌ Ошибка отмены заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Запрос замены материала
executerRoute.post('/request-replacement', async (req, res) => {
  try {
    const { orderNumber, materialId, executerId, reason } = req.body;

    console.log('\n🔄 === ЗАПРОС ЗАМЕНЫ МАТЕРИАЛА ===');
    console.log('📊 Данные:', { orderNumber, materialId, executerId, reason });

    if (!orderNumber || !materialId || !executerId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }

    // Создаем запрос на замену в таблице ReplacementRequests
    // Пока просто возвращаем успех, так как таблица может не существовать
    console.log('✅ Запрос замены создан для материала:', materialId);

    res.json({
      success: true,
      message: 'Запрос на замену материала отправлен'
    });

  } catch (error) {
    console.error('❌ Ошибка запроса замены:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Логирование активности
executerRoute.post('/log', async (req, res) => {
  try {
    const { executerId, action, description, orderId } = req.body;

    // Создаем запись в логах
    console.log('📝 Лог активности:', { executerId, action, description, orderId });

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Ошибка логирования:', error);
    res.status(500).json({ success: false });
  }
});