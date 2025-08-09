import express from 'express';
import { Op } from 'sequelize';
import { Services, Material, ServiceAccess, Executer, ServiceExecution, MaterialReplacement, ExecuterPricing } from '../../../database/dbTables.js';

const router = express.Router();

// GET /api/executers/services/:executerId - Получить услуги исполнителя с индивидуальными ценами
router.get('/services/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n🎯 === API: ПОЛУЧЕНИЕ УСЛУГ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Получаем услуги двумя способами:
    // 1. Через ServiceAccess (доступ к услугам) - только активные услуги
    const serviceAccess = await ServiceAccess.findAll({
      where: { executer_id: executerId },
      include: [{
        model: Services,
        as: 'Service',
        where: {
          status: 'active' // Только активные услуги
        },
        attributes: ['id', 'name', 'price', 'category', 'description', 'status']
      }]
    });

    // 2. Через прямое назначение в Services (executer_id) - только активные услуги
    const assignedServices = await Services.findAll({
      where: {
        executer_id: executerId,
        status: 'active' // Только активные услуги
      },
      attributes: ['id', 'name', 'price', 'category', 'description', 'status']
    });

    // Объединяем результаты и убираем дубликаты
    const accessServices = serviceAccess.map(access => access.Service).filter(Boolean);
    const allServices = [...accessServices, ...assignedServices];

    // Убираем дубликаты по ID
    const uniqueServices = allServices.filter((service, index, self) =>
      index === self.findIndex(s => s.id === service.id)
    );

    // Получаем индивидуальные цены для каждой услуги
    const servicesWithIndividualPrices = await Promise.all(
      uniqueServices.map(async (service) => {
        try {
          // Ищем индивидуальную цену в ExecuterPricing
          const individualPricing = await ExecuterPricing.findOne({
            where: {
              executer_id: executerId,
              service_id: service.id
            }
          });

          const finalPrice = individualPricing?.custom_price || service.price;

          console.log(`💰 Service "${service.name}": ${individualPricing ? `Individual ${finalPrice}₽` : `Standard ${service.price}₽`}`);

          return {
            ...service.toJSON(),
            price: finalPrice,
            has_individual_price: !!individualPricing
          };
        } catch (error) {
          console.warn(`⚠️ Ошибка получения цены для услуги ${service.id}:`, error.message);
          return {
            ...service.toJSON(),
            has_individual_price: false
          };
        }
      })
    );

    console.log(`📋 Найдено услуг через ServiceAccess: ${accessServices.length}`);
    console.log(`📋 Найдено услуг через прямое назначение: ${assignedServices.length}`);
    console.log(`📋 Итого уникальных услуг: ${uniqueServices.length}`);
    console.log(`💰 Услуг с индивидуальными ценами: ${servicesWithIndividualPrices.filter(s => s.has_individual_price).length}`);

    res.json(servicesWithIndividualPrices);
  } catch (error) {
    console.error('❌ Ошибка при получении услуг исполнителя:', error);
    res.status(500).json({
      message: 'Ошибка при получении услуг исполнителя',
      error: error.message
    });
  }
});

// GET /api/executers/materials/:serviceId - Получить материалы для услуги
router.get('/materials/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    console.log(`\n📦 === API: ПОЛУЧЕНИЕ МАТЕРИАЛОВ УСЛУГИ ===`);
    console.log(`🎯 Service ID: ${serviceId}`);

    // Получаем все материалы для услуги (не только доступные)
    const materials = await Material.findAll({
      where: {
        service_id: serviceId
      },
      attributes: ['id', 'contents', 'status', 'type_key'],
      order: [['create_date_material', 'DESC']]
    });

    console.log(`📦 Найдено материалов: ${materials.length}`);

    res.json(materials);
  } catch (error) {
    console.error('❌ Ошибка при получении материалов услуги:', error);
    res.status(500).json({
      message: 'Ошибка при получении материалов услуги',
      error: error.message
    });
  }
});

// GET /api/executers-bot/order-materials/:orderNumber - Получить материалы для конкретного заказа (для бота)
router.get('/order-materials/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { telegramId } = req.query; // Изменено с executerId на telegramId

    console.log(`\n📦 === API BOT: ПОЛУЧЕНИЕ МАТЕРИАЛОВ ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`👤 Telegram ID: ${telegramId}`);
    console.log(`🌐 Request URL: ${req.originalUrl}`);
    console.log(`🌐 Request Path: ${req.path}`);

    // Проверяем, что исполнитель имеет доступ к этому заказу
    if (telegramId) {
      // Сначала находим исполнителя по telegram_id
      const { Executer } = await import('../../../database/dbTables.js');
      const executer = await Executer.findOne({
        where: { telegram_id: telegramId.toString() }
      });

      if (!executer) {
        console.log(`❌ Исполнитель с Telegram ID ${telegramId} не найден`);
        return res.status(404).json({
          success: false,
          message: 'Исполнитель не найден'
        });
      }

      console.log(`✅ Исполнитель найден: ID ${executer.id}, Name: ${executer.name}`);

      const execution = await ServiceExecution.findOne({
        where: {
          order_number: orderNumber,
          executer_id: executer.id // Используем внутренний ID для поиска
        }
      });

      console.log(`🔍 ServiceExecution найден:`, execution ? 'ДА' : 'НЕТ');

      if (!execution) {
        console.log(`❌ Нет доступа к заказу ${orderNumber} для исполнителя ${executer.id}`);
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому заказу'
        });
      }

      // Получаем все доступные материалы для услуги из этого заказа
      const materials = await Material.findAll({
        where: {
          service_id: execution.service_id,
          status: 'available' // Только доступные материалы
        },
        attributes: ['id', 'contents', 'status', 'type_key', 'service_id'],
        order: [['createdAt', 'ASC']],
        limit: 10 // Ограничиваем количество для производительности
      });

      console.log(`📦 Найдено доступных материалов для услуги ${execution.service_id}: ${materials.length}`);

      // Логируем материалы перед отправкой
      materials.forEach(material => {
        console.log(`📦 Material: ${material.contents} (Status: ${material.status})`);
      });

      const response = {
        success: true,
        data: materials
      };

      console.log(`📤 Отправляем ответ:`, response);

      res.json(response);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID не указан'
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при получении материалов заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// GET /api/executers/material/:materialId - Получить информацию о конкретном материале
router.get('/material/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findOne({
      where: {
        id: materialId,
        status: 'available'
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден или недоступен'
      });
    }

    res.json(material);

  } catch (error) {
    console.error('Ошибка при получении материала:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// POST /api/executers/use-material - Использовать материал для заказа
router.post('/use-material', async (req, res) => {
  try {
    const { service_id, material_id, executer_id, order_number } = req.body;

    console.log(`\n📝 === API: ИСПОЛЬЗОВАНИЕ МАТЕРИАЛА ===`);
    console.log(`🎯 Service ID: ${service_id}`);
    console.log(`📦 Material ID: ${material_id}`);
    console.log(`👤 Executer ID: ${executer_id}`);
    console.log(`📋 Order Number: ${order_number}`);

    // Проверяем, что материал доступен
    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    if (material.status !== 'available') {
      return res.status(400).json({ message: 'Материал недоступен для использования' });
    }

    // Проверяем, что номер заказа уникален для этого исполнителя
    const existingExecution = await ServiceExecution.findOne({
      where: {
        order_number,
        executer_id
      }
    });

    if (existingExecution) {
      return res.status(400).json({
        message: `Заказ с номером ${order_number} уже существует`
      });
    }

    // Создаем ServiceExecution
    const serviceExecution = await ServiceExecution.create({
      service_id,
      executer_id,
      order_number,
      material_contents: material.contents,
      status: 'in_progress',
      started_at: new Date()
    });

    // Обновляем статус материала на 'used'
    await material.update({ status: 'used' });

    // Создаем запись MaterialReplacement для связи
    await MaterialReplacement.create({
      material_id,
      service_execution_id: serviceExecution.id,
      executer_id,
      reason: 'Использование материала в заказе',
      status: 'completed',
      replaced_at: new Date()
    });

    // Получаем информацию об услуге
    const service = await Services.findByPk(service_id);

    console.log(`✅ Заказ создан и материал использован: ServiceExecution ID ${serviceExecution.id}`);

    res.json({
      message: 'Заказ успешно создан и материал использован',
      executionId: serviceExecution.id,
      orderNumber: order_number,
      serviceName: service?.name,
      materialContent: material.contents
    });

  } catch (error) {
    console.error('❌ Ошибка при использовании материала:', error);
    res.status(500).json({
      message: 'Ошибка при создании заказа с материалом',
      error: error.message
    });
  }
});

// GET /api/executers/active-executions/:executerId - Получить активные заказы
router.get('/active-executions/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n📋 === API: ПОЛУЧЕНИЕ АКТИВНЫХ ЗАКАЗОВ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    const executions = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: {
          [Op.in]: ['pending', 'active', 'in_progress'] // Только активные статусы, исключаем completed и cancelled
        }
      },
      include: [{
        model: Services,
        as: 'Service',
        where: {
          status: 'active' // Только активные услуги
        },
        attributes: ['id', 'name', 'price', 'category', 'status'],
        required: true // INNER JOIN - исключает заказы с удаленными услугами
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Найдено активных заказов с активными услугами: ${executions.length}`);

    res.json(executions);
  } catch (error) {
    console.error('❌ Ошибка при получении активных заказов:', error);
    res.status(500).json({
      message: 'Ошибка при получении активных заказов',
      error: error.message
    });
  }
});

// GET /api/executers/execution/:executionId - Получить детали заказа
router.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    console.log(`\n🔧 === API: ПОЛУЧЕНИЕ ДЕТАЛЕЙ ЗАКАЗА ===`);
    console.log(`📋 Execution ID: ${executionId}`);

    const execution = await ServiceExecution.findByPk(executionId, {
      include: [{
        model: Services,
        as: 'Service',
        where: {
          status: 'active' // Только активные услуги
        },
        attributes: ['id', 'name', 'price', 'category', 'status'],
        required: true // INNER JOIN - исключает заказы с удаленными услугами
      }]
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден или услуга неактивна'
      });
    }

    console.log(`📋 Заказ найден: ${execution.order_number}`);

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('❌ Ошибка при получении деталей заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении деталей заказа',
      error: error.message
    });
  }
});

// PUT /api/executers/complete-execution/:executionId - Завершить заказ
router.put('/complete-execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { executerId } = req.body;

    console.log(`\n✅ === API: ЗАВЕРШЕНИЕ ЗАКАЗА ===`);
    console.log(`📋 Execution ID: ${executionId}`);
    console.log(`👤 Executer ID: ${executerId}`);

    const execution = await ServiceExecution.findOne({
      where: {
        id: executionId,
        executer_id: executerId
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['name']
      }]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (execution.status === 'completed') {
      return res.status(400).json({ message: 'Заказ уже завершен' });
    }

    // Обновляем статус на завершенный
    await execution.update({
      status: 'completed',
      completed_at: new Date()
    });

    console.log(`✅ Заказ ${execution.order_number} завершен`);

    res.json({
      message: 'Заказ успешно завершен',
      order_number: execution.order_number,
      service_name: execution.Service?.name
    });

  } catch (error) {
    console.error('❌ Ошибка при завершении заказа:', error);
    res.status(500).json({
      message: 'Ошибка при завершении заказа',
      error: error.message
    });
  }
});

// GET /api/executers/used-materials/:serviceId/:executerId - Получить используемые материалы
router.get('/used-materials/:serviceId/:executerId', async (req, res) => {
  try {
    const { serviceId, executerId } = req.params;

    console.log(`\n🔄 === API: ПОЛУЧЕНИЕ ИСПОЛЬЗУЕМЫХ МАТЕРИАЛОВ ===`);
    console.log(`🎯 Service ID: ${serviceId}`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Получаем материалы через MaterialReplacement
    const materialReplacements = await MaterialReplacement.findAll({
      where: {
        executer_id: executerId
      },
      include: [{
        model: Material,
        as: 'Material',
        where: { service_id: serviceId },
        attributes: ['id', 'contents', 'status', 'type_key']
      }, {
        model: ServiceExecution,
        as: 'ServiceExecution',
        where: { service_id: serviceId },
        attributes: ['id', 'order_number', 'status']
      }]
    });

    const materials = materialReplacements.map(replacement => replacement.Material);

    console.log(`📦 Найдено используемых материалов: ${materials.length}`);

    res.json(materials);
  } catch (error) {
    console.error('❌ Ошибка при получении используемых материалов:', error);
    res.status(500).json({
      message: 'Ошибка при получении используемых материалов',
      error: error.message
    });
  }
});

// PUT /api/executers/cancel-execution/:executionId - Отменить заказ
router.put('/cancel-execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { executerId, reason } = req.body;

    console.log(`\n❌ === API: ОТМЕНА ЗАКАЗА ===`);
    console.log(`📋 Execution ID: ${executionId}`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`📝 Причина: ${reason}`);

    const execution = await ServiceExecution.findOne({
      where: {
        id: executionId,
        executer_id: executerId
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['name']
      }]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (execution.status === 'cancelled') {
      return res.status(400).json({ message: 'Заказ уже отменен' });
    }

    // Обновляем статус на отмененный
    await execution.update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancel_reason: reason
    });

    console.log(`❌ Заказ ${execution.order_number} отменен`);

    res.json({
      message: 'Заказ успешно отменен',
      order_number: execution.order_number,
      service_name: execution.Service?.name
    });

  } catch (error) {
    console.error('❌ Ошибка при отмене заказа:', error);
    res.status(500).json({
      message: 'Ошибка при отмене заказа',
      error: error.message
    });
  }
});

// Создать новое выполнение услуги
router.post('/create-service-execution', async (req, res) => {
  try {
    const { order_number, executer_id, service_id } = req.body;

    console.log(`\n🔄 === СОЗДАНИЕ ВЫПОЛНЕНИЯ УСЛУГИ ===`);
    console.log(`📝 Номер заказа: ${order_number}`);
    console.log(`👤 ID исполнителя: ${executer_id}`);
    console.log(`🎯 ID услуги: ${service_id}`);

    // Проверяем обязательные поля
    if (!order_number || !executer_id || !service_id) {
      return res.status(400).json({
        message: 'Отсутствуют обязательные поля: order_number, executer_id, service_id'
      });
    }

    // Проверяем, существует ли исполнитель
    const executer = await Executer.findByPk(executer_id);
    if (!executer) {
      return res.status(400).json({
        message: 'Исполнитель не найден'
      });
    }

    // Проверяем, существует ли услуга
    const service = await Services.findByPk(service_id);
    if (!service) {
      return res.status(400).json({
        message: 'Услуга не найдена'
      });
    }

    // Создаем выполнение услуги
    const serviceExecution = await ServiceExecution.create({
      order_number,
      executer_id,
      service_id,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`✅ Выполнение услуги создано с ID: ${serviceExecution.id}`);

    res.json({
      id: serviceExecution.id,
      order_number: serviceExecution.order_number,
      serviceName: service.name,
      executerName: executer.name,
      created_at: serviceExecution.created_at
    });

  } catch (error) {
    console.error('❌ Ошибка при создании выполнения услуги:', error);
    res.status(500).json({
      message: 'Ошибка при создании выполнения услуги',
      error: error.message
    });
  }
});

// GET /api/executer/stats/:executerId - Получить статистику исполнителя
router.get('/stats/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n📊 === API: ПОЛУЧЕНИЕ СТАТИСТИКИ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Проверяем существование исполнителя
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      return res.status(404).json({
        message: 'Исполнитель не найден'
      });
    }

    // Получаем статистику из ServiceExecution
    const completedOrders = await ServiceExecution.count({
      where: {
        executer_id: executerId,
        status: 'completed'
      }
    });

    const activeOrders = await ServiceExecution.count({
      where: {
        executer_id: executerId,
        status: 'in_progress'
      }
    });

    // Получаем запросы на замену
    const replacementRequests = await MaterialReplacement.count({
      where: {
        executer_id: executerId
      }
    });

    // Используем реальный баланс исполнителя как общий заработок
    const totalEarnings = executer.balance || 0;

    // Рейтинг из базы данных
    const rating = executer.rating || 5.0;

    const stats = {
      completedOrders,
      activeOrders,
      totalEarnings,
      rating,
      replacementRequests
    };

    console.log(`✅ Статистика получена:`, stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Ошибка при получении статистики:', error);
    res.status(500).json({
      message: 'Ошибка при получении статистики',
      error: error.message
    });
  }
});

// GET /api/executer/balance/:executerId - Получить баланс исполнителя
router.get('/balance/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n💰 === API: ПОЛУЧЕНИЕ БАЛАНСА ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Проверяем существование исполнителя
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      return res.status(404).json({
        message: 'Исполнитель не найден'
      });
    }

    // Получаем баланс исполнителя
    const balance = executer.balance || 0;

    console.log(`✅ Баланс получен: ${balance}`);

    res.json({ balance });

  } catch (error) {
    console.error('❌ Ошибка при получении баланса:', error);
    res.status(500).json({
      message: 'Ошибка при получении баланса',
      error: error.message
    });
  }
});

// POST /api/executers/use-material-for-order - Пометить материал как использованный для заказа
router.post('/use-material-for-order', async (req, res) => {
  try {
    const { material_id, service_id, executer_id, order_number } = req.body;

    console.log(`\n🔄 === ИСПОЛЬЗОВАНИЕ МАТЕРИАЛА ДЛЯ ЗАКАЗА ===`);
    console.log(`📦 Material ID: ${material_id}`);
    console.log(`🎯 Service ID: ${service_id}`);
    console.log(`👤 Executer ID: ${executer_id}`);
    console.log(`📋 Order Number: ${order_number}`);

    // Обновляем статус материала на "used" и добавляем номер заказа
    const [updatedRows] = await Material.update({
      status: 'used',
      order_number: order_number,
      used_date: new Date(),
      executer_id: executer_id
    }, {
      where: {
        id: material_id,
        service_id: service_id
      }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        message: 'Материал не найден или уже использован'
      });
    }

    console.log(`✅ Материал ${material_id} помечен как использованный для заказа ${order_number}`);

    res.json({
      message: 'Материал успешно помечен как использованный',
      material_id,
      order_number,
      status: 'used'
    });

  } catch (error) {
    console.error('❌ Ошибка при использовании материала для заказа:', error);
    res.status(500).json({
      message: 'Ошибка при использовании материала для заказа',
      error: error.message
    });
  }
});

// POST /api/executers/complete-order - Завершение заказа (ожидает подтверждения админа)
router.post('/complete-order', async (req, res) => {
  try {
    const { order_number, service_id, executer_id, status } = req.body;

    console.log(`\n✅ === ЗАВЕРШЕНИЕ ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${order_number}`);
    console.log(`🎯 Service ID: ${service_id}`);
    console.log(`👤 Executer ID: ${executer_id}`);

    // Получаем услугу для базовой цены
    const service = await Services.findByPk(service_id);
    if (!service) {
      return res.status(404).json({
        message: 'Услуга не найдена'
      });
    }

    // Получаем индивидуальную цену исполнителя
    let individualPrice = service.price; // По умолчанию базовая цена

    try {
      // Используем внутренний вызов к adminPricingService
      const adminPricingService = await import('../../service/ServiceAdmim/adminPricingService.js');
      const customPrice = await adminPricingService.default.getPriceForExecuter(executer_id, service_id);
      if (customPrice) {
        individualPrice = customPrice;
      }
      console.log(`💰 Individual Price: ${individualPrice}₽ (base: ${service.price}₽)`);
    } catch (priceError) {
      console.warn('Не удалось получить индивидуальную цену, используем базовую:', priceError.message);
    }

    // Обновляем статус ServiceExecution с индивидуальной ценой
    const [updatedRows] = await ServiceExecution.update({
      status: status || 'pending_approval',
      completed_date: new Date(),
      price: individualPrice  // Сохраняем индивидуальную цену
    }, {
      where: {
        order_number: order_number,
        service_id: service_id,
        executer_id: executer_id
      }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        message: 'Заказ не найден'
      });
    }

    console.log(`✅ Заказ ${order_number} отправлен на подтверждение с ценой ${individualPrice}₽`);

    res.json({
      message: 'Заказ отправлен на подтверждение администратора',
      order_number,
      status: status || 'pending_approval',
      price: individualPrice
    });

  } catch (error) {
    console.error('❌ Ошибка при завершении заказа:', error);
    res.status(500).json({
      message: 'Ошибка при завершении заказа',
      error: error.message
    });
  }
});

// POST /api/executers/cancel-order - Отмена заказа (возврат материалов в статус available)
router.post('/cancel-order', async (req, res) => {
  try {
    const { order_number, service_id, executer_id } = req.body;

    console.log(`\n❌ === ОТМЕНА ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${order_number}`);
    console.log(`🎯 Service ID: ${service_id}`);
    console.log(`👤 Executer ID: ${executer_id}`);

    // Возвращаем материалы в статус "available" и очищаем order_number
    const [updatedMaterialsRows] = await Material.update({
      status: 'available',
      order_number: null,
      used_date: null,
      executer_id: null
    }, {
      where: {
        order_number: order_number,
        service_id: service_id,
        executer_id: executer_id
      }
    });

    // Удаляем или помечаем ServiceExecution как отмененный
    const [updatedExecutionRows] = await ServiceExecution.update({
      status: 'cancelled',
      cancelled_date: new Date()
    }, {
      where: {
        order_number: order_number,
        service_id: service_id,
        executer_id: executer_id
      }
    });

    console.log(`✅ Заказ ${order_number} отменен, ${updatedMaterialsRows} материалов возвращено`);

    res.json({
      message: `Заказ отменен, ${updatedMaterialsRows} материалов возвращено в статус "Доступны"`,
      order_number,
      materials_restored: updatedMaterialsRows,
      status: 'cancelled'
    });

  } catch (error) {
    console.error('❌ Ошибка при отмене заказа:', error);
    res.status(500).json({
      message: 'Ошибка при отмене заказа',
      error: error.message
    });
  }
});

// POST /api/executers-bot/bot-cancel-order - Отмена заказа через бота
router.post('/bot-cancel-order', async (req, res) => {
  try {
    const { orderNumber, telegramId, reason } = req.body;

    console.log(`\n❌ === BOT: ОТМЕНА ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`👤 Telegram ID: ${telegramId}`);
    console.log(`📝 Reason: ${reason}`);

    // Находим исполнителя по telegram_id
    const { Executer } = await import('../../../database/dbTables.js');
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId.toString() }
    });

    if (!executer) {
      console.log(`❌ Исполнитель с Telegram ID ${telegramId} не найден`);
      return res.status(404).json({
        success: false,
        message: 'Исполнитель не найден'
      });
    }

    // Находим ServiceExecution
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executer.id
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Возвращаем материалы в статус "available"
    await Material.update({
      status: 'available',
      order_number: null,
      executer_id: null,
      executer_name: null
    }, {
      where: { order_number: orderNumber }
    });

    // Отменяем заказ
    await execution.update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancel_reason: reason
    });

    console.log(`✅ Заказ ${orderNumber} отменен через бота`);

    res.json({
      success: true,
      message: 'Заказ успешно отменен'
    });

  } catch (error) {
    console.error('❌ Ошибка отмены заказа через бота:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// POST /api/executers-bot/bot-complete-order - Завершение заказа через бота
router.post('/bot-complete-order', async (req, res) => {
  try {
    const { orderNumber, telegramId } = req.body;

    console.log(`\n✅ === BOT: ЗАВЕРШЕНИЕ ЗАКАЗА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`👤 Telegram ID: ${telegramId}`);

    // Находим исполнителя по telegram_id
    const { Executer } = await import('../../../database/dbTables.js');
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId.toString() }
    });

    if (!executer) {
      console.log(`❌ Исполнитель с Telegram ID ${telegramId} не найден`);
      return res.status(404).json({
        success: false,
        message: 'Исполнитель не найден'
      });
    }

    // Находим ServiceExecution
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executer.id
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Помечаем материалы как использованные
    await Material.update({
      status: 'used'
    }, {
      where: { order_number: orderNumber }
    });

    // Завершаем заказ
    await execution.update({
      status: 'completed',
      completed_at: new Date()
    });

    console.log(`✅ Заказ ${orderNumber} завершен через бота`);

    res.json({
      success: true,
      message: 'Заказ успешно завершен'
    });

  } catch (error) {
    console.error('❌ Ошибка завершения заказа через бота:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// GET /api/executers/completed-orders/:executerId - Получить выполненные заказы
router.get('/completed-orders/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n✅ === API: ПОЛУЧЕНИЕ ВЫПОЛНЕННЫХ ЗАКАЗОВ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    const executions = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: 'completed'
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name', 'price', 'category']
      }],
      order: [['updated_at', 'DESC']],
      limit: 50 // Ограничиваем количество для производительности
    });

    console.log(`✅ Найдено выполненных заказов: ${executions.length}`);

    res.json(executions);
  } catch (error) {
    console.error('❌ Ошибка при получении выполненных заказов:', error);
    res.status(500).json({
      message: 'Ошибка при получении выполненных заказов',
      error: error.message
    });
  }
});

// POST /api/executers-bot/assign-material - Назначить материал заказу
router.post('/assign-material', async (req, res) => {
  try {
    const { orderNumber, materialId, telegramId } = req.body;

    console.log(`\n📦 === BOT: НАЗНАЧЕНИЕ МАТЕРИАЛА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`📦 Material ID: ${materialId}`);
    console.log(`👤 Telegram ID: ${telegramId}`);

    // Находим исполнителя по telegram_id
    const { Executer } = await import('../../../database/dbTables.js');
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId.toString() }
    });

    if (!executer) {
      console.log(`❌ Исполнитель с Telegram ID ${telegramId} не найден`);
      return res.status(404).json({
        success: false,
        message: 'Исполнитель не найден'
      });
    }

    // Проверяем, что материал доступен
    const material = await Material.findOne({
      where: {
        id: materialId,
        status: 'available'
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден или недоступен'
      });
    }

    // Назначаем материал заказу
    await material.update({
      status: 'used',
      order_number: orderNumber,
      executer_id: executer.id,
      executer_name: executer.name,
      used_date: new Date()
    });

    console.log(`✅ Материал ${materialId} назначен заказу ${orderNumber}`);

    res.json({
      success: true,
      message: 'Материал успешно назначен заказу',
      material: {
        id: material.id,
        contents: material.contents
      }
    });

  } catch (error) {
    console.error('❌ Ошибка назначения материала:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

export default router;
