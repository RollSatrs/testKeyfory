import express from 'express';
import { Op } from 'sequelize';
import { Services, Material, ServiceAccess, Executer, ServiceExecution, MaterialReplacement, ExecuterPricing, Order } from '../../../database/dbTables.js';
import { sequelize } from '../../../database/databaseOn.js';
import { updateExecuterActivity } from '../../service/ServiceExecuter/executerService.js';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

const router = express.Router();

// Middleware: если в запросе есть telegramId (в query или body) — помечаем исполнителя активным
router.use(async (req, res, next) => {
  try {
    const telegramId = req.query.telegramId || (req.body && req.body.telegramId) || (req.body && req.body.telegram_id);
    if (telegramId) {
      try {
        // Находим исполнителя и обновляем активность
        // Преобразуем в строку для корректного сравнения с БД
        const stringTelegramId = telegramId.toString();
        const executer = await Executer.findOne({ where: { telegram_id: stringTelegramId } });
        if (executer) {
          await updateExecuterActivity(executer.id);
        }
      } catch (e) {
        console.warn('Не удалось обновить активность через middleware:', e.message);
      }
    }
  } catch (e) {
    // middleware не должен ломать основной поток
    console.warn('Ошибка middleware активности:', e.message);
  }
  next();
});

// GET /api/executers/services/:executerId - Получить услуги исполнителя с индивидуальными ценами
router.get('/services/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
  const { orderNumber } = req.query; // optional: if provided, mark services that cannot create execution

    console.log(`\n🎯 === API: ПОЛУЧЕНИЕ УСЛУГ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Получаем услуги двумя способами:
    // 1. Через ServiceAccess (доступ к услугам) - только активные услуги
    // Позволяем старым записям с пустым статусом считаться активными для совместимости
    const serviceAccess = await ServiceAccess.findAll({
      where: { executer_id: executerId },
      include: [{
        model: Services,
        as: 'Service',
        where: {
          [Op.or]: [
            { status: 'active' },
            { status: '' },
            { status: null }
          ]
        },
        attributes: ['id', 'name', 'price', 'category', 'description', 'status']
      }]
    });

    // 2. Через прямое назначение в Services (executer_id) - только активные услуги
    const assignedServices = await Services.findAll({
      where: {
        executer_id: executerId,
        [Op.or]: [
          { status: 'active' },
          { status: '' },
          { status: null }
        ]
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

          // determine if a new execution for this order/service can be created
          let can_create_execution = true;
          try {
            if (orderNumber) {
              // if any execution exists with this order number, disallow creating another
              const existingOrderExec = await ServiceExecution.findOne({ where: { order_number: orderNumber } });
              if (existingOrderExec) can_create_execution = false;
            }

            // also disallow if this executer already has an active execution for this service
            const activeExecForService = await ServiceExecution.findOne({
              where: {
                service_id: service.id,
                executer_id: executerId,
                status: { [Op.in]: ['pending', 'in_progress', 'active'] }
              }
            });
            if (activeExecForService) can_create_execution = false;
          } catch (flagErr) {
            console.warn('Error checking execution flags:', flagErr.message);
          }

          // Fetch last execution for this service by this executer to expose per-executer status
          let lastExec = null;
          try {
            lastExec = await ServiceExecution.findOne({
              where: { service_id: service.id, executer_id },
              order: [['created_at', 'DESC']]
            });
          } catch (execErr) {
            console.warn('Не удалось получить последний execution для сервиса', service.id, execErr.message);
          }

          return {
            ...service.toJSON(),
            price: finalPrice,
            has_individual_price: !!individualPricing,
            can_create_execution,
            executionStatus: lastExec ? lastExec.status : null,
            lastExecution: lastExec ? {
              id: lastExec.id,
              order_number: lastExec.order_number,
              status: lastExec.status,
              started_at: lastExec.started_at,
              completed_at: lastExec.completed_at,
              price: lastExec.price
            } : null
          };
        } catch (error) {
          console.warn(`⚠️ Ошибка получения цены для услуги ${service.id}:`, error.message);
          return {
            ...service.toJSON(),
            has_individual_price: false,
            can_create_execution: true
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
      const stringTelegramId = telegramId.toString();
      const executer = await Executer.findOne({
        where: { telegram_id: stringTelegramId }
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

      // Сначала получаем уже назначенные материалы для этого заказа
      // ИСКЛЮЧАЕМ замененные материалы - показываем только активные (использованные)
      const assignedMaterials = await Material.findAll({
        where: {
          service_id: execution.service_id,
          order_number: orderNumber,  // Материалы, уже назначенные к этому заказу
          executer_id: executer.id,   // Назначенные этому исполнителю
          status: MATERIAL_STATUS.USED  // ТОЛЬКО использованные (не замененные!)
        },
        attributes: ['id', 'contents', 'status', 'type_key', 'service_id', 'order_number', 'executer_id'],
        order: [['used_date', 'DESC']],  // Самые новые сначала (после замены)
      });

      console.log(`📦 Найдено назначенных материалов для заказа ${orderNumber}: ${assignedMaterials.length}`);

      // Если есть назначенные материалы, возвращаем их
      if (assignedMaterials.length > 0) {
        assignedMaterials.forEach(material => {
          console.log(`📦 Assigned Material: ${material.contents} (Status: ${material.status}, Order: ${material.order_number})`);
        });

        return res.json({
          success: true,
          data: assignedMaterials
        });
      }

      // Если назначенных материалов нет, ищем доступные и автоматически назначаем их
      const availableMaterials = await Material.findAll({
        where: {
          service_id: execution.service_id,
          status: MATERIAL_STATUS.AVAILABLE, // Только доступные материалы
          order_number: [null, ''] // Не назначенные к заказам
        },
        attributes: ['id', 'contents', 'status', 'type_key', 'service_id'],
        order: [['added_date', 'ASC']],  // Тот же порядок, что в автоназначении
        limit: 1 // Берем только один материал для автоназначения
      });

      console.log(`📦 Найдено доступных материалов для услуги ${execution.service_id}: ${availableMaterials.length}`);

      // Если есть доступные материалы, автоматически назначаем первый на заказ
      if (availableMaterials.length > 0) {
        const materialToAssign = availableMaterials[0];

        try {
          // Автоматически назначаем материал на заказ
          await Material.update({
            status: MATERIAL_STATUS.USED,
            order_number: orderNumber,
            used_date: new Date(),
            executer_id: executer.id
          }, {
            where: {
              id: materialToAssign.id,
              status: MATERIAL_STATUS.AVAILABLE // Убеждаемся, что материал еще доступен
            }
          });

          console.log(`✅ Автоматически назначен материал ${materialToAssign.id} на заказ ${orderNumber}`);

          // Обновляем статус материала и возвращаем его
          materialToAssign.status = MATERIAL_STATUS.USED;
          materialToAssign.order_number = orderNumber;
          materialToAssign.executer_id = executer.id;

          return res.json({
            success: true,
            data: [materialToAssign]
          });

        } catch (assignError) {
          console.error(`❌ Ошибка при автоназначении материала:`, assignError);
          // Если ошибка при назначении, показываем как доступные
        }
      }

      // Логируем материалы перед отправкой
      availableMaterials.forEach(material => {
        console.log(`📦 Available Material: ${material.contents} (Status: ${material.status})`);
      });

      // Если нет доступных материалов для автоназначения, возвращаем пустой ответ
      const response = {
        success: true,
        data: [] // Пустой массив, если нет материалов
      };

      console.log(`📤 Отправляем пустой ответ - нет доступных материалов:`, response);

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

// POST /api/executers-bot/reserve-material - Резервировать материал для показа исполнителю
router.post('/reserve-material', async (req, res) => {
  try {
    const { service_id, telegram_id } = req.body;

    console.log(`\n📝 === РЕЗЕРВАЦИЯ МАТЕРИАЛА ===`);
    console.log(`🎯 Service ID: ${service_id}`);
    console.log(`👤 Telegram ID: ${telegram_id}`);

    if (!service_id || !telegram_id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID и Telegram ID обязательны'
      });
    }

    // Сначала освобождаем старые резервации этого пользователя (старше 10 минут)
    await Material.update(
      { reserved_for: null, reserved_at: null },
      {
        where: {
          reserved_for: telegram_id,
          reserved_at: {
            [Op.lt]: new Date(Date.now() - 10 * 60 * 1000) // 10 минут назад
          }
        }
      }
    );

    // Находим доступный материал для резервации
    const availableMaterial = await Material.findOne({
      where: {
        service_id: service_id,
        status: MATERIAL_STATUS.AVAILABLE,
        reserved_for: null // Не зарезервирован
      },
      order: [['added_date', 'ASC']] // Самый старый
    });

    if (!availableMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Нет доступных материалов для этой услуги'
      });
    }

    // Резервируем материал
    await availableMaterial.update({
      reserved_for: telegram_id,
      reserved_at: new Date()
    });

    console.log(`✅ Материал ${availableMaterial.id} зарезервирован для пользователя ${telegram_id}`);

    res.json({
      success: true,
      data: {
        id: availableMaterial.id,
        contents: availableMaterial.contents,
        service_id: availableMaterial.service_id,
        reserved_until: new Date(Date.now() + 10 * 60 * 1000) // 10 минут от текущего времени
      }
    });

  } catch (error) {
    console.error('❌ Ошибка при резервации материала:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// POST /api/executers-bot/use-reserved-material - Использовать зарезервированный материал
router.post('/use-reserved-material', async (req, res) => {
  try {
    const { telegram_id, order_number, executer_id, service_id } = req.body;

    console.log(`\n📝 === ИСПОЛЬЗОВАНИЕ ЗАРЕЗЕРВИРОВАННОГО МАТЕРИАЛА ===`);
    console.log(`👤 Telegram ID: ${telegram_id}`);
    console.log(`📋 Order Number: ${order_number}`);
    console.log(`👤 Executer ID: ${executer_id}`);
    console.log(`🎯 Service ID: ${service_id}`);

    // Находим зарезервированный материал этого пользователя для данной услуги
    const reservedMaterial = await Material.findOne({
      where: {
        service_id: service_id,
        reserved_for: telegram_id,
        status: MATERIAL_STATUS.AVAILABLE,
        reserved_at: {
          [Op.gt]: new Date(Date.now() - 10 * 60 * 1000) // Резервация не старше 10 минут
        }
      }
    });

    if (!reservedMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Зарезервированный материал не найден или резервация истекла'
      });
    }

    // Получаем информацию об исполнителе
    const executer = await Executer.findByPk(executer_id);
    const executerName = executer ? executer.name : 'Неизвестный исполнитель';

    // Используем зарезервированный материал
    const useDate = new Date();
    await reservedMaterial.update({
      status: MATERIAL_STATUS.USED,
      order_number: order_number,
      executer_id: executer_id,
      executer_name: executerName,
      used_date: useDate,
      reserved_for: null, // Очищаем резервацию
      reserved_at: null
    });

    console.log(`✅ Зарезервированный материал ${reservedMaterial.id} использован для заказа ${order_number}`);
    console.log(`📅 Дата использования зарезервированного материала: ${useDate.toISOString()}`);
    console.log(`👤 Материал назначен исполнителю: ${executerName} (ID: ${executer_id})`);

    res.json({
      success: true,
      message: 'Материал успешно использован',
      data: {
        material_id: reservedMaterial.id,
        contents: reservedMaterial.contents,
        order_number: order_number,
        executer_name: executerName
      }
    });

  } catch (error) {
    console.error('❌ Ошибка при использовании зарезервированного материала:', error);
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
        status: MATERIAL_STATUS.AVAILABLE
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

    if (material.status !== MATERIAL_STATUS.AVAILABLE) {
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

    // Создаем запись MaterialReplacement для статистики перед удалением
    await MaterialReplacement.create({
      material_id,
      service_execution_id: serviceExecution.id,
      executer_id,
      reason: 'Использование материала в заказе',
      status: 'completed',
      replaced_at: new Date()
    });

    // Удаляем материал после использования (вместо обновления статуса)
    await material.destroy();
    console.log(`🗑️ Расходный материал ${material.id} удален после использования в заказе ${order_number}`);

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
          // Поддерживаем совместимость со старыми записями: считаем услуги активными,
          // если их статус 'active' или пустая строка или NULL
          [Op.or]: [
            { status: 'active' },
            { status: '' },
            { status: null }
          ]
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
          [Op.or]: [
            { status: 'active' },
            { status: '' },
            { status: null }
          ]
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

// GET /api/executers-bot/execution-by-order/:orderNumber - Получить execution по номеру заказа
router.get('/execution-by-order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    console.log(`\n🔍 === API BOT: GET execution by order ===`);
    console.log(`📋 Order Number: ${orderNumber}`);

    const execution = await ServiceExecution.findOne({
      where: { order_number: orderNumber },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'price', 'status', 'replacement_type'],
          required: false
        },
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id'],
          required: false
        }
      ]
    });

    if (!execution) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    res.json({ success: true, data: execution });
  } catch (error) {
    console.error('❌ Ошибка получения execution по номеру заказа:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
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

    // Don't allow completing if any execution for same order_number is already completed by another executer
    const completedForOrder = await ServiceExecution.findOne({ where: { order_number: execution.order_number, status: 'completed' } });
    if (completedForOrder && completedForOrder.id !== execution.id) {
      return res.status(400).json({ message: `Заказ ${execution.order_number} уже завершён другим исполнителем` });
    }

    // Вычисляем индивидуальную цену исполнителя и сохраняем её при завершении
    let individualPrice = 0;
    try {
      const serviceAccess = await ServiceAccess.findOne({
        where: {
          executer_id: executerId,
          service_id: execution.service_id,
          status: 'active'
        }
      });

      const service = await Services.findByPk(execution.service_id);

      // Если в serviceAccess явно указана числовая цена — используем её.
      const accessPrice = serviceAccess && Number.isFinite(Number(serviceAccess.price)) ? Number(serviceAccess.price) : undefined;
      individualPrice = Number.isFinite(accessPrice) ? accessPrice : (Number.isFinite(service?.price) ? Number(service.price) : 0);
      console.log(`💰 Выбранная цена для записи: ${individualPrice}₽`);
    } catch (priceError) {
      console.warn('⚠️ Ошибка при получении индивидуальной цены, ставлю 0:', priceError.message);
      individualPrice = 0;
    }

    // Обновляем статус на завершенный и сохраняем цену
    await execution.update({
      status: 'completed',
      completed_at: new Date(),
      price: individualPrice
    });

    console.log(`✅ Заказ ${execution.order_number} завершен`);

    // Завершаем активную услугу в системе лимитов
    try {
      const executer = await Executer.findByPk(executerId);
      if (executer) {
        const ActiveServicesService = await import('../../service/ServiceAdmim/adminActiveServicesService.js');
        await ActiveServicesService.completeService(executerId, execution.order_number);
        console.log(`✅ Активная услуга для заказа ${execution.order_number} завершена в системе лимитов`);
      }
    } catch (activeServiceError) {
      console.warn(`⚠️ Не удалось завершить активную услугу для заказа ${execution.order_number}:`, activeServiceError.message);
      // Не прерываем выполнение, так как основной заказ уже завершен
    }

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

// DELETE /api/executers-bot/materials/:materialId - Удалить использованный материал
router.delete('/materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const { executerId, orderNumber, reason } = req.body;

    console.log(`\n🗑️ === API: УДАЛЕНИЕ МАТЕРИАЛА ===`);
    console.log(`📋 Material ID: ${materialId}`);
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`📦 Order Number: ${orderNumber}`);
    console.log(`📝 Reason: ${reason}`);

    // Находим материал
    const material = await Material.findByPk(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    // Проверяем, что материал назначен на этот заказ
    if (material.order_number !== orderNumber) {
      return res.status(400).json({
        message: 'Материал не назначен на указанный заказ',
        assigned_order: material.order_number,
        requested_order: orderNumber
      });
    }

    // Удаляем материал
    await material.destroy();

    console.log(`✅ Материал ${materialId} успешно удален`);

    res.json({
      success: true,
      message: 'Материал успешно удален после использования',
      material_id: materialId,
      order_number: orderNumber
    });

  } catch (error) {
    console.error('❌ Ошибка при удалении материала:', error);
    res.status(500).json({
      message: 'Ошибка при удалении материала',
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

// Handler to create service execution (used by two routes: legacy and new)
const createServiceExecutionHandler = async (req, res) => {
  try {
    // Accept both snake_case and camelCase from different clients (bot uses camelCase)
    const order_number = req.body.order_number || req.body.orderNumber || req.body.order;
    const executer_id = req.body.executer_id || req.body.executerId || req.body.executerId;
    const service_id = req.body.service_id || req.body.serviceId || req.body.serviceId;

    console.log(`\n🔄 === СОЗДАНИЕ ВЫПОЛНЕНИЯ УСЛУГИ ===`);
    console.log(`📝 Номер заказа: ${order_number}`);
    console.log(`👤 ID исполнителя: ${executer_id}`);
    console.log(`🎯 ID услуги: ${service_id}`);

    // Проверяем обязательные поля
    if (!order_number || !executer_id || !service_id) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствуют обязательные поля: order_number, executer_id, service_id'
      });
    }

    // Проверяем, существует ли исполнитель
    const executer = await Executer.findByPk(executer_id);
    if (!executer) {
      return res.status(400).json({ message: 'Исполнитель не найден' });
    }

    // Проверяем, существует ли услуга
    const service = await Services.findByPk(service_id);
    if (!service) {
      return res.status(400).json({ message: 'Услуга не найдена' });
    }

    // Блокировка дубликатов: запрещаем дубли для того же исполнителя,
    // но разрешаем создание попыток другими исполнителями — это позволит
    // отображать в админке статусы по каждому исполнителю отдельно.
    const existingForExecuter = await ServiceExecution.findOne({ where: { order_number, executer_id } });
    if (existingForExecuter) {
      return res.status(400).json({ success: false, message: `Заказ с номером ${order_number} уже существует для этого исполнителя` });
    }

    // Создаем выполнение услуги и пытаемся атомарно присвоить материал (если есть)
    const t = await sequelize.transaction();
    try {
      const serviceExecution = await ServiceExecution.create({
        order_number,
        executer_id,
        service_id,
        status: 'in_progress',
        created_at: new Date()
      }, { transaction: t });

      // Попробуем найти доступный материал для этой услуги и пометить его использованным
      const availableMaterial = await Material.findOne({
        where: {
          service_id: service_id,
          order_id: null,
          order_number: null,
          status: { [Op.ne]: MATERIAL_STATUS.USED }
        },
        order: [['added_date', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (availableMaterial) {
        // Получаем имя исполнителя для корректного логирования
        const executerName = executer ? executer.name : 'Неизвестный исполнитель';

        await availableMaterial.update({
          status: MATERIAL_STATUS.USED,
          order_number: order_number,
          used_date: new Date(), // Фиксируем дату использования при создании заказа
          executer_id: executer_id,
          executer_name: executerName
        }, { transaction: t });

        console.log(`📅 Материал ${availableMaterial.id} - установлена дата использования: ${new Date().toISOString()}`);

        // Сохраняем содержимое материала в выполнении
        await serviceExecution.update({ material_contents: availableMaterial.contents }, { transaction: t });
      }

      await t.commit();

      console.log(`✅ Выполнение услуги создано с ID: ${serviceExecution.id}`);

      res.json({
        success: true,
        id: serviceExecution.id,
        order_number: serviceExecution.order_number,
        serviceName: service.name,
        executerName: executer.name,
        created_at: serviceExecution.created_at,
        materialAssigned: !!availableMaterial
      });
    } catch (txErr) {
      await t.rollback();
      throw txErr;
    }

  } catch (error) {
    console.error('❌ Ошибка при создании выполнения услуги:', error);
    res.status(500).json({ success: false, message: 'Ошибка при создании выполнения услуги', error: error.message });
  }
};

// Register both the canonical and the legacy route used by the bot
router.post('/create-service-execution', createServiceExecutionHandler);
router.post('/service-execution', createServiceExecutionHandler);

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

    // Рассчитываем общий заработок на основе индивидуальных цен из ServiceExecution
    let totalEarnings = 0;
    try {
      const completedExecutions = await ServiceExecution.findAll({
        where: {
          executer_id: executerId,
          status: 'completed'
        },
        attributes: ['price']
      });

      totalEarnings = completedExecutions.reduce((sum, execution) => {
        return sum + (execution.price || 0);
      }, 0);

      console.log(`💰 Расчет заработка: найдено ${completedExecutions.length} выполненных заказов, общая сумма: ${totalEarnings}₽`);
    } catch (earningsError) {
      console.error('⚠️ Ошибка расчета заработка, используем баланс из профиля:', earningsError.message);
      totalEarnings = executer.balance || 0;
    }

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

    // Вычисляем актуальный баланс на основе выполненных заказов (чтобы не полагаться на устаревшее поле в профиле)
    let computedBalance = 0;
    try {
      const sum = await ServiceExecution.sum('price', {
        where: {
          executer_id: executerId,
          status: 'completed'
        }
      });
      computedBalance = sum || 0;
    } catch (sumErr) {
      console.warn('Не удалось вычислить баланс по выполненным заказам:', sumErr.message);
      computedBalance = executer.balance || 0;
    }

    console.log(`✅ Баланс (computed) для исполнителя ${executerId}: ${computedBalance}`);

    res.json({ balance: computedBalance });

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
      status: MATERIAL_STATUS.USED,
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
      status: MATERIAL_STATUS.USED
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
    let individualPrice = Number.isFinite(service.price) ? service.price : 0; // По умолчанию базовая цена

    try {
      // Используем внутренний вызов к adminPricingService
      const adminPricingService = await import('../../service/ServiceAdmim/adminPricingService.js');
      const customPrice = await adminPricingService.default.getPriceForExecuter(executer_id, service_id);
      // Примем customPrice, только если это числовое значение (включая 0)
      if (customPrice != null && Number.isFinite(Number(customPrice))) {
        individualPrice = Number(customPrice);
      }
      console.log(`💰 Individual Price: ${individualPrice}₽ (base: ${service.price}₽)`);
    } catch (priceError) {
      console.warn('Не удалось получить индивидуальную цену, используем базовую:', priceError.message);
    }

    // Обновляем статус ServiceExecution с индивидуальной ценой
    // Не позволяем пометить заказ как завершенный, если другой исполнител уже завершил его
    const alreadyCompleted = await ServiceExecution.findOne({ where: { order_number: order_number, status: 'completed' } });
    if (alreadyCompleted) {
      return res.status(400).json({ message: `Заказ ${order_number} уже завершён другим исполнителем` });
    }

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
      status: MATERIAL_STATUS.AVAILABLE,
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
      status: MATERIAL_STATUS.AVAILABLE,
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
    const { Executer, ExecuterEarnings } = await import('../../../database/dbTables.js');
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

    // Получаем индивидуальную цену исполнителя для данной услуги
    let individualPrice = 0;
    let basePrice = 0;
    try {
      // Сначала получаем базовую цену услуги
      const service = await Services.findByPk(execution.service_id);
      basePrice = Number.isFinite(service?.price) ? Number(service.price) : 0;

      // Ищем ServiceAccess - поддерживаем как активные, так и записи без статуса
      const serviceAccess = await ServiceAccess.findOne({
        where: {
          executer_id: executer.id,
          service_id: execution.service_id
          // Убираем фильтр по статусу, так как в базе статус undefined
        }
      });

      // Ищем индивидуальную цену в ExecuterPricing
      const executerPricing = await ExecuterPricing.findOne({
        where: {
          executer_id: executer.id,
          service_id: execution.service_id
        }
      });

      // Определяем итоговую цену по приоритету:
      // 1. ExecuterPricing.custom_price (высший приоритет)
      // 2. ServiceAccess.price (если указана)
      // 3. Service.price (базовая цена)
      if (executerPricing && Number.isFinite(Number(executerPricing.custom_price))) {
        individualPrice = Number(executerPricing.custom_price);
        console.log(`💰 Используем индивидуальную цену: ${individualPrice}₽`);
      } else if (serviceAccess && Number.isFinite(Number(serviceAccess.price))) {
        individualPrice = Number(serviceAccess.price);
        console.log(`💰 Используем цену из ServiceAccess: ${individualPrice}₽`);
      } else {
        individualPrice = basePrice;
        console.log(`💰 Используем базовую цену услуги: ${individualPrice}₽`);
      }

      console.log(`💰 Итоговая цена для записи: ${individualPrice}₽ (базовая: ${basePrice}₽)`);
    } catch (priceError) {
      console.error('⚠️ Ошибка получения цены, использую базовую цену услуги:', priceError.message);

      // Fallback: пытаемся получить хотя бы базовую цену
      try {
        const service = await Services.findByPk(execution.service_id);
        individualPrice = basePrice = Number.isFinite(service?.price) ? Number(service.price) : 0;
      } catch (fallbackError) {
        console.error('⚠️ Не удалось получить даже базовую цену:', fallbackError.message);
        individualPrice = basePrice = 0;
      }
    }

    // Don't allow completing if another executer already completed this order
    const completedOther = await ServiceExecution.findOne({ where: { order_number: orderNumber, status: 'completed' } });
    if (completedOther && completedOther.id !== execution.id) {
      return res.status(400).json({ success: false, message: `Заказ ${orderNumber} уже завершён другим исполнителем` });
    }

    // Выполним обновления в транзакции: обновление execution и корректное изменение баланса
    const t = await sequelize.transaction();
    try {
      // Материалы уже должны быть помечены как 'used' при их назначении
      // Проверяем и логируем состояние материалов для отладки
      const relatedMaterials = await Material.findAll({
        where: { order_number: orderNumber },
        attributes: ['id', 'status', 'order_number', 'executer_id'],
        transaction: t
      });

      console.log(`📦 Материалы для заказа ${orderNumber}:`, relatedMaterials.map(m => ({
        id: m.id,
        status: m.status,
        executer_id: m.executer_id
      })));

      // Сохраняем предыдущую цену, чтобы корректно обновить баланс только на дельту
      const previousPrice = Number.isFinite(Number(execution.price)) ? Number(execution.price) : 0;
      const finalPrice = Number.isFinite(Number(individualPrice)) ? Number(individualPrice) : 0;

      await execution.update({
        status: 'completed',
        completed_at: new Date(),
        price: finalPrice // Сохраняем индивидуальную цену при завершении
      }, { transaction: t });

      // Обновляем баланс исполнителя только на разницу (чтобы быть идемпотентным)
      const delta = finalPrice - previousPrice;
      if (delta !== 0) {
        const currentBalance = Number.isFinite(Number(executer.balance)) ? Number(executer.balance) : 0;
        const newBalance = currentBalance + delta;
        await executer.update({ balance: newBalance }, { transaction: t });
        console.log(`💰 Баланс исполнителя ${executer.id} обновлён на ${delta}₽ -> ${newBalance}₽`);
      } else {
        console.log('ℹ️ Баланс исполнителя не изменился (delta=0)');
      }

      // НОВОЕ: Создаем запись о заработке в таблице ExecuterEarnings
      // Сначала попытаемся найти или создать Order для связи
      let orderId = null;
      try {
        // Ищем существующий Order по номеру заказа
        const existingOrder = await Order.findOne({
          where: {
            service_id: execution.service_id,
            executer_id: executer.id
          },
          transaction: t
        });

        if (existingOrder) {
          orderId = existingOrder.id;
          console.log(`📋 Найден существующий Order: ${orderId}`);
        } else {
          // Создаем минимальный Order для связи
          const tempOrder = await Order.create({
            service_id: execution.service_id,
            executer_id: executer.id,
            total_sum: finalPrice,
            status: 'completed',
            payment_status: 'paid',
            created_at: new Date()
          }, { transaction: t });

          orderId = tempOrder.id;
          console.log(`📋 Создан новый Order: ${orderId}`);
        }
      } catch (orderError) {
        console.warn('⚠️ Не удалось создать/найти Order, используем null:', orderError.message);
        orderId = null;
      }

      await ExecuterEarnings.create({
        executer_id: executer.id,
        service_id: execution.service_id,
        order_id: orderId,
        amount: finalPrice,
        base_price: basePrice,
        custom_price: individualPrice !== basePrice ? individualPrice : null,
        status: 'paid', // Сразу помечаем как выплачено, поскольку баланс уже обновлен
        created_at: new Date()
      }, { transaction: t });

      console.log(`💰 Создана запись о заработке: ${finalPrice}₽ для исполнителя ${executer.id} за услугу ${execution.service_id} (order_id: ${orderId})`);

      await t.commit();

      console.log(`✅ Заказ ${orderNumber} завершен через бота с ценой ${finalPrice}₽`);

      res.json({
        success: true,
        message: 'Заказ успешно завершен'
      });
    } catch (txErr) {
      await t.rollback();
      console.error('❌ Ошибка транзакции при завершении заказа через бота:', txErr.message);
      return res.status(500).json({ success: false, message: 'Ошибка при завершении заказа' });
    }

  } catch (error) {
    console.error('❌ Ошибка завершения заказа через бота:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// GET /api/executers/completed-orders/:executerId - Получить выполненные и отмененные заказы
router.get('/completed-orders/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n✅ === API: ПОЛУЧЕНИЕ ВЫПОЛНЕННЫХ И ОТМЕНЕННЫХ ЗАКАЗОВ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    const executions = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: {
          [Op.in]: ['completed', 'cancelled']
        }
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name', 'category', 'description']
      }],
      order: [['completed_at', 'DESC']],
      limit: 50 // Ограничиваем количество для производительности
    });

    // Добавляем информацию о цене из ServiceExecution (индивидуальная цена)
    const ordersWithPrices = executions.map(execution => {
      const executionData = execution.toJSON();
      // Цена теперь берется из поля price в ServiceExecution, а не из Services
      if (executionData.Service) {
        executionData.Service.price = executionData.price || executionData.Service.price || 0;
      }
      return executionData;
    });

    console.log(`✅ Найдено заказов в истории: ${executions.length} (выполненные и отмененные, с индивидуальными ценами)`);

    res.json(ordersWithPrices);
  } catch (error) {
    console.error('❌ Ошибка при получении заказов для истории:', error);
    res.status(500).json({
      message: 'Ошибка при получении заказов для истории',
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
        status: MATERIAL_STATUS.AVAILABLE
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
      status: MATERIAL_STATUS.USED,
      order_number: orderNumber,
      executer_id: executer.id,
      executer_name: executer.name,
      used_date: new Date() // Фиксируем дату использования при назначении материала
    });

    console.log(`✅ Материал ${materialId} назначен заказу ${orderNumber}`);
    console.log(`📅 Дата использования установлена: ${new Date().toISOString()}`);

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

// POST /request-replacement - Запрос на замену материала
router.post('/request-replacement', async (req, res) => {
  try {
    const { orderNumber, materialId, telegramId, reason } = req.body;

    console.log(`\n🔄 === ЗАПРОС НА ЗАМЕНУ МАТЕРИАЛА ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`📦 Material ID: ${materialId}`);
    console.log(`👤 Telegram ID: ${telegramId}`);
    console.log(`📝 Reason: ${reason}`);

    // Проверяем обязательные поля
    if (!orderNumber || !materialId || !telegramId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны для заполнения'
      });
    }

    // Находим исполнителя по telegram_id
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId.toString() }
    });

    if (!executer) {
      return res.status(404).json({
        success: false,
        message: 'Исполнитель не найден'
      });
    }

    // Находим заказ
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executer.id
      },
      include: [
        {
          model: Services,
          as: 'Service'
        }
      ]
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Находим материал
    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден'
      });
    }

    // Проверяем, есть ли уже Order в details execution
    let orderId = null;

    // Пытаемся найти существующий Order по данным execution
    const existingOrder = await Order.findOne({
      where: {
        service_id: execution.service_id,
        executer_id: executer.id,
        details: {
          order_number: orderNumber
        }
      }
    });

    if (existingOrder) {
      orderId = existingOrder.id;
      console.log(`📋 Найден существующий Order с ID: ${orderId}`);
    } else {
      console.log(`⚠️ Order для заказа ${orderNumber} не найден, создаем запрос замены без order_id`);
      // Временно пропускаем создание Order и используем заглушку
      // В реальной системе нужно будет либо создать Order, либо изменить схему БД
    }

    // Создаем запрос на замену
    const replacementData = {
      executer_id: executer.id,
      material_id: materialId,
      service_execution_id: execution.id,
      reason: reason,
      status: 'pending'
    };

    // Добавляем order_id только если найден существующий Order
    if (orderId) {
      replacementData.order_id = orderId;
    } else {
      // Временное решение: создаем минимальный Order
      try {
        const tempOrder = await Order.create({
          service_id: execution.service_id,
          executer_id: executer.id,
          total_sum: 0,
          status: 'active',
          payment_status: 'pending',
          details: {
            order_number: orderNumber,
            service_execution_id: execution.id,
            temp_order: true
          }
        });
        replacementData.order_id = tempOrder.id;
        console.log(`📋 Создан временный Order с ID: ${tempOrder.id}`);
      } catch (orderError) {
        console.error('❌ Ошибка создания временного Order:', orderError);
        return res.status(500).json({
          success: false,
          message: 'Ошибка создания заказа для запроса замены'
        });
      }
    }

    const replacementRequest = await MaterialReplacement.create(replacementData);

    console.log(`✅ Запрос на замену создан с ID: ${replacementRequest.id}`);

    // Обновляем материал, добавляем дату запроса замены
    const replacementDate = new Date();
    await material.update({
      status: 'pending_replace',
      replacement_requested_date: replacementDate
    });

    console.log(`📅 Материал ${materialId} обновлен: статус "pending_replace", дата запроса замены: ${replacementDate.toISOString()}`);
    console.log(`🔄 Запрос замены для заказа ${orderNumber} от исполнителя ${executer.name} (${telegramId})`);

    // Проверяем настройки автоматической замены для услуги
    const service = await Services.findByPk(execution.service_id, {
      attributes: ['id', 'name', 'replacement_type']
    });

    if (service && (service.replacement_type === 'auto' || service.replacement_type === 'automatic')) {
      console.log(`🔄 Услуга "${service.name}" настроена на автоматическую замену, выполняем замену...`);

      try {
        // Импортируем adminRoute для использования auto-replace-material
        const { default: adminRoute } = await import('../../route/RouteAdmin/adminRoute.js');

        // Создаем фальшивый объект запроса для auto-replace-material
        const fakeReq = {
          body: {
            currentMaterialId: materialId,
            executerId: executer.id,
            serviceId: execution.service_id
          }
        };

        const fakeRes = {
          json: (data) => {
            console.log('✅ Автоматическая замена выполнена:', data);
          },
          status: (code) => ({
            json: (data) => {
              console.log(`❌ Ошибка автоматической замены (${code}):`, data);
            }
          })
        };

        // Находим доступный материал для замены
        const availableMaterials = await Material.findAll({
          where: {
            service_id: execution.service_id,
            status: MATERIAL_STATUS.AVAILABLE
          },
          limit: 1
        });

        if (availableMaterials.length === 0) {
          console.log('❌ Нет доступных материалов для автоматической замены');
          return res.json({
            success: true,
            message: 'Запрос на замену отправлен (автоматическая замена недоступна - нет материалов)',
            request: {
              id: replacementRequest.id,
              status: replacementRequest.status
            }
          });
        }

        // Выполняем автоматическую замену напрямую
        const { sequelize } = await import('../../../database/databaseOn.js');

        await sequelize.transaction(async (t) => {
          // Получаем старый материал
          const currentMaterial = await Material.findByPk(materialId, { transaction: t });
          const newMaterial = availableMaterials[0];

          // Переносим данные со старого материала на новый
          await Material.update(
            {
              status: MATERIAL_STATUS.USED,
              executer_id: currentMaterial.executer_id,
              order_number: currentMaterial.order_number,
              used_date: new Date()
            },
            {
              where: { id: newMaterial.id },
              transaction: t
            }
          );

          // Старый материал получает статус "заменен"
          await Material.update(
            {
              status: MATERIAL_STATUS.REPLACED,
              executer_id: null,
              order_number: null,
              used_date: null
            },
            {
              where: { id: materialId },
              transaction: t
            }
          );

          // Обновляем статус запроса на замену
          await MaterialReplacement.update(
            {
              status: 'completed',
              admin_response: 'Автоматическая замена выполнена системой',
              processed_at: new Date()
            },
            {
              where: { id: replacementRequest.id },
              transaction: t
            }
          );

          console.log(`✅ Автоматическая замена выполнена: ${currentMaterial.id} → ${newMaterial.id}`);
        });

        return res.json({
          success: true,
          message: 'Материал автоматически заменен',
          request: {
            id: replacementRequest.id,
            status: 'completed',
            autoReplaced: true,
            oldMaterial: {
              id: materialId,
              contents: material.contents,
              status: MATERIAL_STATUS.REPLACED
            },
            newMaterial: {
              id: availableMaterials[0].id,
              contents: availableMaterials[0].contents,
              status: MATERIAL_STATUS.USED
            }
          }
        });

      } catch (autoError) {
        console.error('❌ Ошибка автоматической замены:', autoError);
        // Продолжаем с обычным запросом на замену
      }
    }

    res.json({
      success: true,
      message: 'Запрос на замену успешно отправлен',
      request: {
        id: replacementRequest.id,
        status: replacementRequest.status
      }
    });

  } catch (error) {
    console.error('❌ Ошибка создания запроса на замену:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// GET /api/executers-bot/replacement-settings/:serviceId - Получить настройки замены для услуги
router.get('/replacement-settings/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    console.log(`\n⚙️ === API: НАСТРОЙКИ ЗАМЕНЫ ===`);
    console.log(`🛠️ Service ID: ${serviceId}`);

    // Получаем услугу с настройками замены
    const service = await Services.findByPk(serviceId, {
      attributes: ['id', 'name', 'replacement_type']
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    // Возвращаем настройки замены (по умолчанию "manual")
    const replacementType = service.replacement_type || 'manual';

    console.log(`⚙️ Replacement Type: ${replacementType}`);

    res.json({
      success: true,
      data: {
        serviceId: service.id,
        serviceName: service.name,
        replacementType: replacementType
      }
    });

  } catch (error) {
    console.error('❌ Ошибка получения настроек замены:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// GET /api/executers-bot/test-limits/:telegramId - Тестовый endpoint для проверки лимитов
router.get('/test-limits/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    console.log(`\n🧪 === ТЕСТ API: ПРОВЕРКА ЛИМИТОВ ===`);
    console.log(`👤 Telegram ID: ${telegramId}`);

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId }
    });

    if (!executer) {
      return res.status(404).json({
        success: false,
        error: 'Исполнитель не найден'
      });
    }

    // Получаем информацию об активных услугах через новый сервис
    try {
      const ActiveServicesService = await import('../../service/ServiceAdmim/adminActiveServicesService.js');
      const canActivate = await ActiveServicesService.canExecuterActivateService(executer.id);
      const activeServices = await ActiveServicesService.getExecuterActiveServices(executer.id);

      console.log(`📊 Текущие лимиты: ${canActivate.currentActive}/${canActivate.limit || '∞'}`);
      console.log(`✅ Может активировать: ${canActivate.allowed}`);
      console.log(`📋 Активных услуг: ${activeServices.length}`);

      const response = {
        success: true,
        executer: {
          id: executer.id,
          name: executer.name,
          telegram_id: executer.telegram_id,
          status: executer.status
        },
        limits: {
          current_active: canActivate.currentActive,
          max_limit: canActivate.limit,
          can_activate: canActivate.allowed,
          remaining: canActivate.remaining || 0,
          reason: canActivate.reason
        },
        active_services: activeServices.map(service => ({
          id: service.id,
          service_id: service.service_id,
          service_name: service.Service?.name || 'Неизвестная услуга',
          order_number: service.order_number,
          activated_at: service.activated_at,
          status: service.status
        }))
      };

      console.log(`📊 Ответ API:`, JSON.stringify(response.limits, null, 2));

      res.json(response);

    } catch (serviceError) {
      console.error('❌ Ошибка сервиса активных услуг:', serviceError);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения информации об активных услугах',
        details: serviceError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка тестового API:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/test-activate - Тестовый endpoint для активации услуги
router.post('/test-activate', async (req, res) => {
  try {
    const { telegram_id, service_id, order_number } = req.body;

    console.log(`\n🧪 === ТЕСТ API: АКТИВАЦИЯ УСЛУГИ ===`);
    console.log(`👤 Telegram ID: ${telegram_id}`);
    console.log(`🛠️ Service ID: ${service_id}`);
    console.log(`📋 Order Number: ${order_number}`);

    if (!telegram_id || !service_id || !order_number) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать telegram_id, service_id и order_number'
      });
    }

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id }
    });

    if (!executer) {
      return res.status(404).json({
        success: false,
        error: 'Исполнитель не найден'
      });
    }

    // Пробуем активировать услугу
    try {
      const ActiveServicesService = await import('../../service/ServiceAdmim/adminActiveServicesService.js');
      const result = await ActiveServicesService.activateService(
        executer.id,
        parseInt(service_id),
        order_number.toString()
      );

      if (!result.success) {
        console.log(`❌ Активация не удалась: ${result.error}`);
        return res.status(400).json({
          success: false,
          error: result.error,
          limits: {
            current_active: result.currentActive,
            max_limit: result.limit
          }
        });
      }

      console.log(`✅ Услуга активирована: ${result.currentActive}/${result.limit || '∞'}`);

      res.json({
        success: true,
        message: `Услуга активирована! Активных услуг: ${result.currentActive}${result.limit ? `/${result.limit}` : '/∞'}`,
        limits: {
          current_active: result.currentActive,
          max_limit: result.limit
        },
        active_service: {
          id: result.activeService.id,
          service_name: result.activeService.Service?.name,
          order_number: result.activeService.order_number,
          activated_at: result.activeService.activated_at
        }
      });

    } catch (serviceError) {
      console.error('❌ Ошибка активации услуги:', serviceError);
      res.status(500).json({
        success: false,
        error: 'Ошибка активации услуги',
        details: serviceError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка тестового API активации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/bot-complete-order - Завершить заказ через бот
router.post('/bot-complete-order', async (req, res) => {
  try {
    const { orderNumber, telegramId } = req.body;

    console.log(`\n✅ === API: ЗАВЕРШЕНИЕ ЗАКАЗА ЧЕРЕЗ БОТ ===`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`👤 Telegram ID: ${telegramId}`);

    // Находим исполнителя по telegram_id
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId }
    });

    if (!executer) {
      return res.status(404).json({
        success: false,
        message: 'Исполнитель не найден'
      });
    }

    // Находим выполнение заказа
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executer.id
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['name', 'price']
      }]
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    if (execution.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Заказ уже завершен'
      });
    }

    // Вычисляем цену и завершаем заказ
    let individualPrice = 0;
    try {
      const serviceAccess = await ServiceAccess.findOne({
        where: {
          executer_id: executer.id,
          service_id: execution.service_id,
          status: 'active'
        }
      });

      const accessPrice = serviceAccess && Number.isFinite(Number(serviceAccess.price)) ? Number(serviceAccess.price) : undefined;
      individualPrice = Number.isFinite(accessPrice) ? accessPrice : (Number.isFinite(execution.Service?.price) ? Number(execution.Service.price) : 0);
    } catch (priceError) {
      console.warn('⚠️ Ошибка при получении индивидуальной цены, ставлю 0:', priceError.message);
    }

    // Завершаем заказ
    await execution.update({
      status: 'completed',
      completed_at: new Date(),
      price: individualPrice
    });

    // Завершаем активную услугу в системе лимитов
    try {
      const ActiveServicesService = await import('../../service/ServiceAdmim/adminActiveServicesService.js');
      await ActiveServicesService.completeService(executer.id, orderNumber);
      console.log(`✅ Активная услуга для заказа ${orderNumber} завершена в системе лимитов`);
    } catch (activeServiceError) {
      console.warn(`⚠️ Не удалось завершить активную услугу для заказа ${orderNumber}:`, activeServiceError.message);
    }

    // ТЕПЕРЬ удаляем все материалы, назначенные на этот заказ
    try {
      console.log(`🗑️ Удаляем материалы для завершенного заказа ${orderNumber}`);
      const materialsToDelete = await Material.findAll({
        where: {
          order_number: orderNumber,
          executer_id: executer.id
        }
      });

      if (materialsToDelete.length > 0) {
        for (const material of materialsToDelete) {
          await material.destroy();
          console.log(`✅ Удален материал ${material.id}: ${material.contents}`);
        }
        console.log(`✅ Удалено ${materialsToDelete.length} материалов для заказа ${orderNumber}`);
      } else {
        console.log(`ℹ️ Нет материалов для удаления по заказу ${orderNumber}`);
      }
    } catch (materialError) {
      console.warn(`⚠️ Ошибка при удалении материалов для заказа ${orderNumber}:`, materialError.message);
      // Не прерываем выполнение - заказ уже завершен
    }

    console.log(`✅ Заказ ${orderNumber} завершен через бот`);

    res.json({
      success: true,
      message: 'Заказ успешно завершен',
      price: individualPrice,
      serviceName: execution.Service?.name || 'Услуга'
    });

  } catch (error) {
    console.error('❌ Ошибка при завершении заказа через бот:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при завершении заказа',
      error: error.message
    });
  }
});

// GET /api/executers-bot/debug-services - Диагностика дублированных услуг
router.get('/debug-services', async (req, res) => {
  try {
    console.log(`\n🔍 === ДИАГНОСТИКА УСЛУГ ===`);

    // Получаем все услуги с подсчетом дублей
    const services = await Services.findAll({
      attributes: ['id', 'name', 'category', 'price', 'status', 'executer_id', 'created_at'],
      include: [
        {
          model: ServiceAccess,
          as: 'ServiceAccesses',
          include: [
            {
              model: Executer,
              attributes: ['id', 'name', 'telegram_id']
            }
          ]
        }
      ],
      order: [['name', 'ASC'], ['created_at', 'ASC']]
    });

    // Группируем по названию для поиска дублей
    const servicesByName = {};
    services.forEach(service => {
      if (!servicesByName[service.name]) {
        servicesByName[service.name] = [];
      }
      servicesByName[service.name].push(service);
    });

    // Находим дублированные услуги
    const duplicates = {};
    const unique = {};

    Object.keys(servicesByName).forEach(name => {
      if (servicesByName[name].length > 1) {
        duplicates[name] = servicesByName[name];
        console.log(`🚨 ДУБЛЬ: "${name}" - ${servicesByName[name].length} записей`);
        servicesByName[name].forEach((service, index) => {
          console.log(`  ${index + 1}. ID: ${service.id}, Executer ID: ${service.executer_id}, Создана: ${service.created_at}`);
          console.log(`     ServiceAccesses: ${service.ServiceAccesses?.length || 0} записей`);
          service.ServiceAccesses?.forEach(access => {
            console.log(`       - Executer: ${access.Executer?.name} (ID: ${access.executer_id})`);
          });
        });
      } else {
        unique[name] = servicesByName[name][0];
      }
    });

    const duplicateCount = Object.keys(duplicates).length;
    const uniqueCount = Object.keys(unique).length;

    console.log(`📊 Статистика:`);
    console.log(`   - Уникальных услуг: ${uniqueCount}`);
    console.log(`   - Дублированных названий: ${duplicateCount}`);
    console.log(`   - Общее количество записей: ${services.length}`);

    res.json({
      success: true,
      statistics: {
        total_services: services.length,
        unique_names: uniqueCount,
        duplicate_names: duplicateCount,
        duplicate_records: services.length - uniqueCount
      },
      duplicates: Object.keys(duplicates).map(name => ({
        service_name: name,
        count: duplicates[name].length,
        services: duplicates[name].map(s => ({
          id: s.id,
          executer_id: s.executer_id,
          created_at: s.created_at,
          status: s.status,
          price: s.price,
          assigned_executers: s.ServiceAccesses?.map(sa => ({
            executer_id: sa.executer_id,
            executer_name: sa.Executer?.name
          })) || []
        }))
      })),
      unique_services: Object.keys(unique).map(name => ({
        service_name: name,
        id: unique[name].id,
        executer_id: unique[name].executer_id,
        assigned_executers: unique[name].ServiceAccesses?.map(sa => ({
          executer_id: sa.executer_id,
          executer_name: sa.Executer?.name
        })) || []
      }))
    });

  } catch (error) {
    console.error('❌ Ошибка диагностики услуг:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка диагностики услуг',
      details: error.message
    });
  }
});

// POST /api/executers/request-limit-approval - Запрос на одобрение превышения лимита
router.post('/request-limit-approval', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { telegram_id, request_reason } = req.body;

    console.log(`\n🎯 === ЗАПРОС ОДОБРЕНИЯ ЛИМИТА ===`);
    console.log(`👤 Telegram ID: ${telegram_id}`);

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id: String(telegram_id) },
      transaction
    });

    if (!executer) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Исполнитель не найден'
      });
    }

    // Получаем текущее количество активных услуг
    const activeServicesCount = await ServiceExecution.count({
      where: {
        executer_id: executer.id,
        status: ['pending', 'in_progress']
      },
      transaction
    });

    // Проверяем, есть ли уже активный запрос
    const { default: LimitApprovalRequest } = await import('../../../database/models/LimitApprovalRequest.js');

    const existingRequest = await LimitApprovalRequest.findOne({
      where: {
        executer_id: executer.id,
        status: 'pending'
      },
      transaction
    });

    if (existingRequest) {
      await transaction.rollback();
      return res.json({
        success: false,
        error: 'У вас уже есть активный запрос на одобрение',
        existing_request: existingRequest
      });
    }

    // Создаем новый запрос
    const approvalRequest = await LimitApprovalRequest.create({
      executer_id: executer.id,
      current_services_count: activeServicesCount,
      current_limit: executer.active_services_limit,
      requested_limit: null, // Запрос на разовое превышение
      request_reason: request_reason || 'Запрос на превышение лимита активных услуг',
      status: 'pending'
    }, { transaction });

    await transaction.commit();

    console.log(`✅ Запрос на одобрение создан: ID ${approvalRequest.id}`);

    res.json({
      success: true,
      message: 'Запрос на одобрение отправлен администратору',
      request: {
        id: approvalRequest.id,
        current_services_count: activeServicesCount,
        current_limit: executer.active_services_limit,
        status: 'pending',
        created_at: approvalRequest.created_at
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Ошибка создания запроса на одобрение:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// GET /api/executers/check-limit-approval/:telegram_id - Проверить статус запроса на одобрение
router.get('/check-limit-approval/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id: String(telegram_id) }
    });

    if (!executer) {
      return res.status(404).json({
        success: false,
        error: 'Исполнитель не найден'
      });
    }

    // Проверяем активный запрос
    const { default: LimitApprovalRequest } = await import('../../../database/models/LimitApprovalRequest.js');

    const activeRequest = await LimitApprovalRequest.findOne({
      where: {
        executer_id: executer.id,
        status: 'pending'
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      has_pending_request: !!activeRequest,
      request: activeRequest || null
    });

  } catch (error) {
    console.error('❌ Ошибка проверки запроса на одобрение:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/notify-service-assigned - Уведомить исполнителя о назначении услуг
router.post('/notify-service-assigned', async (req, res) => {
  try {
    const { telegram_id, executer_name, services, admin_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    console.log(`📢 Запрос на уведомление о назначении услуг исполнителю: ${telegram_id}, услуг: ${services?.length || 0}`);

    try {
      // Импортируем функцию уведомления из бота
      const { notifyServiceAssigned } = await import('../../../../bot/executerBot.js');

      // Отправляем уведомление
      const success = await notifyServiceAssigned(
        telegram_id,
        executer_name || 'Исполнитель',
        services || [],
        admin_name || 'Администратор'
      );

      if (success) {
        res.json({
          success: true,
          message: 'Уведомление о назначении услуг успешно отправлено'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Не удалось отправить уведомление о назначении услуг'
        });
      }
    } catch (importError) {
      console.error('❌ Ошибка импорта функции уведомления о назначении услуг:', importError);
      res.status(500).json({
        success: false,
        error: 'Сервис уведомлений недоступен',
        details: importError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о назначении услуг:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/notify-executer-added - Уведомить исполнителя о добавлении в систему
router.post('/notify-executer-added', async (req, res) => {
  try {
    const { telegram_id, executer_name, admin_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    console.log(`📢 Запрос на уведомление исполнителя: ${telegram_id}, имя: ${executer_name}`);

    try {
      // Импортируем функцию уведомления из бота
      const { notifyExecuterAdded } = await import('../../../../bot/executerBot.js');

      // Отправляем уведомление
      const success = await notifyExecuterAdded(
        telegram_id,
        executer_name || 'Исполнитель',
        admin_name || 'Администратор'
      );

      if (success) {
        res.json({
          success: true,
          message: 'Уведомление успешно отправлено'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Не удалось отправить уведомление'
        });
      }
    } catch (importError) {
      console.error('❌ Ошибка импорта функции уведомления:', importError);
      res.status(500).json({
        success: false,
        error: 'Сервис уведомлений недоступен',
        details: importError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления исполнителю:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/notify-executer-blocked - Уведомить исполнителя о блокировке
router.post('/notify-executer-blocked', async (req, res) => {
  try {
    const { telegram_id, executer_name, admin_name, reason } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    console.log(`🚫 Запрос на уведомление о блокировке исполнителя: ${telegram_id}, имя: ${executer_name}`);

    try {
      // Импортируем функцию уведомления из бота
      const { notifyExecuterBlocked } = await import('../../../../bot/executerBot.js');

      // Отправляем уведомление
      const success = await notifyExecuterBlocked(
        telegram_id,
        executer_name || 'Исполнитель',
        admin_name || 'Администратор',
        reason
      );

      if (success) {
        res.json({
          success: true,
          message: 'Уведомление о блокировке успешно отправлено'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Не удалось отправить уведомление о блокировке'
        });
      }
    } catch (importError) {
      console.error('❌ Ошибка импорта функции уведомления о блокировке:', importError);
      res.status(500).json({
        success: false,
        error: 'Сервис уведомлений о блокировке недоступен',
        details: importError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о блокировке исполнителю:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/notify-executer-unblocked - Уведомить исполнителя о разблокировке
router.post('/notify-executer-unblocked', async (req, res) => {
  try {
    const { telegram_id, executer_name, admin_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    console.log(`✅ Запрос на уведомление о разблокировке исполнителя: ${telegram_id}, имя: ${executer_name}`);

    try {
      // Импортируем функцию уведомления из бота
      const { notifyExecuterUnblocked } = await import('../../../../bot/executerBot.js');

      // Отправляем уведомление
      const success = await notifyExecuterUnblocked(
        telegram_id,
        executer_name || 'Исполнитель',
        admin_name || 'Администратор'
      );

      if (success) {
        res.json({
          success: true,
          message: 'Уведомление о разблокировке успешно отправлено'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Не удалось отправить уведомление о разблокировке'
        });
      }
    } catch (importError) {
      console.error('❌ Ошибка импорта функции уведомления о разблокировке:', importError);
      res.status(500).json({
        success: false,
        error: 'Сервис уведомлений недоступен',
        details: importError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о разблокировке исполнителю:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// GET /api/executers-bot/executer/telegram/:telegramId - Получить информацию об исполнителе по telegram_id
router.get('/executer/telegram/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    console.log(`🔍 Запрос информации об исполнителе с telegram_id: ${telegramId}`);

    // Импортируем функцию для получения исполнителя
    const { getExecuterByTelegramId } = await import('../../service/ServiceAdmim/adminExecuterService.js');

    const executer = await getExecuterByTelegramId(telegramId);

    if (!executer) {
      return res.status(404).json({
        success: false,
        error: 'Исполнитель не найден'
      });
    }

    console.log(`✅ Исполнитель найден: ID=${executer.id}, статус=${executer.status}`);

    res.json({
      success: true,
      data: {
        id: executer.id,
        name: executer.name,
        telegram_id: executer.telegram_id,
        status: executer.status,
        active_services_limit: executer.active_services_limit
      }
    });

  } catch (error) {
    console.error(`❌ Ошибка получения информации об исполнителе по telegram_id ${req.params.telegramId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// POST /api/executers-bot/notify-material-edited - Уведомить исполнителя о редактировании материала
router.post('/notify-material-edited', async (req, res) => {
  try {
    const { telegram_id, executer_name, material_info, admin_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id обязателен'
      });
    }

    if (!material_info) {
      return res.status(400).json({
        success: false,
        error: 'material_info обязателен'
      });
    }

    console.log(`📝 Запрос на уведомление о редактировании материала исполнителю: ${telegram_id}, материал: ${material_info.contents}`);

    try {
      // Импортируем функцию уведомления из бота
      const { notifyMaterialEdited } = await import('../../../../bot/executerBot.js');

      // Отправляем уведомление
      const success = await notifyMaterialEdited(
        telegram_id,
        executer_name || 'Исполнитель',
        material_info,
        admin_name || 'Администратор'
      );

      if (success) {
        res.json({
          success: true,
          message: 'Уведомление о редактировании материала успешно отправлено'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Не удалось отправить уведомление о редактировании материала'
        });
      }
    } catch (importError) {
      console.error('❌ Ошибка импорта функции уведомления о редактировании материала:', importError);
      res.status(500).json({
        success: false,
        error: 'Сервис уведомлений недоступен',
        details: importError.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о редактировании материала:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// PUT /api/executers-bot/update-activity - Публичный endpoint для обновления активности бота (без авторизации)
router.put('/update-activity', async (req, res) => {
  try {
    const { telegram_id, is_bot_active, last_bot_activity } = req.body;

    console.log(`📥 [BOT] Получен запрос на обновление активности:`, {
      telegram_id,
      is_bot_active,
      last_bot_activity
    });

    if (!telegram_id) {
      console.error('❌ [BOT] telegram_id не предоставлен');
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    const { updateExecuter } = await import('../../service/ServiceAdmim/adminExecuterService.js');

    const updateData = {
      is_bot_active: is_bot_active !== undefined ? is_bot_active : true,
      last_bot_activity: last_bot_activity || new Date()
    };

    console.log(`🔄 [BOT] Обновляем данные:`, updateData);
    console.log(`🔍 [BOT] Поиск по telegram_id: ${telegram_id}`);

    // Найти исполнителя по telegram_id и обновить его активность
    const result = await updateExecuter(null, updateData, {
      searchBy: 'telegram_id',
      telegram_id
    });

    console.log(`✅ [BOT] Результат обновления:`, result);
    console.log(`🟢 [BOT] Обновлена активность исполнителя ${telegram_id}: ${is_bot_active ? 'онлайн' : 'офлайн'}`);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [BOT] Ошибка обновления активности исполнителя в боте:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/executers-bot/all-executers - Получить всех исполнителей для автоматической проверки активности
router.get('/all-executers', async (req, res) => {
  try {
    console.log('🔍 Запрос всех исполнителей для проверки активности...');

    const { getAllExecuters } = await import('../../service/ServiceAdmim/adminExecuterService.js');
    const executers = await getAllExecuters();

    console.log(`👥 Найдено исполнителей: ${executers ? executers.length : 0}`);

    if (!executers || !Array.isArray(executers)) {
      return res.json([]);
    }

    // Возвращаем только необходимые поля для проверки активности
    const executersForActivity = executers.map(executer => ({
      id: executer.id,
      name: executer.name,
      telegram_id: executer.telegram_id,
      status: executer.status,
      is_bot_active: executer.is_bot_active,
      last_bot_activity: executer.last_bot_activity
    }));

    res.json(executersForActivity);

  } catch (error) {
    console.error('❌ Ошибка получения всех исполнителей:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
