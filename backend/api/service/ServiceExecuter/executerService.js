import { Executer, Services, Material, Log, ServiceAccess, MaterialReplacement, ServiceExecution } from '../../../database/dbTables.js';
import { Op } from 'sequelize';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

// Функция для автоматического обновления активности исполнителя
export const updateExecuterActivity = async (executerId) => {
  try {
    const executer = await Executer.findByPk(executerId);
    if (executer) {
      await executer.update({
        last_activity: new Date(),
        status: 'active'
      });
    }
    return executer;
  } catch (err) {
    console.error('Ошибка при обновлении активности:', err);
  }
};

// Функция для создания лога
export const createExecuterLog = async (executerId, action, description, serviceId = null) => {
  try {
    await Log.create({
      user_id: executerId,
      user_type: 'executer',
      action: action,
      description: description,
      service_id: serviceId
    });
  } catch (err) {
    console.error('Ошибка при создании лога:', err);
  }
};

// Добавление нового исполнителя
export const addExecuter = async (telegramId, name = null) => {
  try {
    if (!telegramId) {
      throw new Error('Не указан telegram_id');
    }

    // Проверяем, есть ли уже такой исполнитель
    const existingExecuter = await Executer.findOne({
  where: { telegram_id: String(telegramId) }
    });

    if (existingExecuter) {
      throw new Error('Исполнитель с таким Telegram ID уже существует');
    }

    const executer = await Executer.create({
      telegram_id: telegramId,
      name: name,
      status: 'inactive', // новые исполнители неактивны до первого действия
      rating: 0,
      balance: 0
    });

    return executer;
  } catch (err) {
    console.error('Ошибка при добавлении исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Проверка существования исполнителя
export const checkExecuter = async (telegramId) => {
  try {
    if (!telegramId) {
      throw new Error('Telegram ID не указан');
    }

    // Ensure we compare strings because telegram_id column is VARCHAR
    const normalizedTelegramId = String(telegramId);
    const executer = await Executer.findOne({
      where: { telegram_id: normalizedTelegramId }
    });

    return executer;
  } catch (err) {
    console.error('Ошибка при проверке исполнителя:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить доступные услуги для исполнителя
export const getExecuterServices = async (executerId) => {
  try {
    console.log(`🔍 Поиск услуг для исполнителя ID: ${executerId}`);

    // Новая система: ищем услуги, где исполнитель назначен напрямую
    const directlyAssignedServices = await Services.findAll({
      where: {
        executer_id: executerId,
        status: 'active'
      },
      attributes: ['id', 'name', 'description', 'price', 'category']
    });

    console.log(`📋 Найдено напрямую назначенных услуг: ${directlyAssignedServices.length}`);

    // Старая система: ищем услуги через таблицу доступа (для совместимости)
    const serviceAccess = await ServiceAccess.findAll({
      where: {
        executer_id: executerId,
        has_access: true
      },
      include: [
        {
          model: Services,
          where: { status: 'active' },
          attributes: ['id', 'name', 'description', 'price', 'category']
        }
      ]
    });

    console.log(`📋 Найдено услуг через ServiceAccess: ${serviceAccess.length}`);

    // Объединяем результаты и убираем дубликаты
    const allServices = [];

    // Добавляем напрямую назначенные услуги
    directlyAssignedServices.forEach(service => {
      allServices.push(service.toJSON());
    });

    // Добавляем услуги из таблицы доступа
    serviceAccess.forEach(access => {
      const service = access.Service.toJSON();
      // Проверяем, нет ли уже такой услуги
      if (!allServices.find(s => s.id === service.id)) {
        allServices.push(service);
      }
    });

    console.log(`📋 Итого уникальных услуг: ${allServices.length}`);
    console.log(`📋 Список услуг:`, allServices.map(s => `ID: ${s.id}, Название: ${s.name}`));

    return allServices;
  } catch (err) {
    console.error('Ошибка при получении услуг:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить баланс исполнителя
export const getExecuterBalance = async (executerId) => {
  try {
    const executer = await Executer.findByPk(executerId);
    return executer?.balance || 0;
  } catch (err) {
    console.error('Ошибка при получении баланса:', err);
    throw new Error('Ошибка сервера');
  }
};

// Записать лог
export const writeExecuterLog = async (userId, userType, action, description, serviceId = null) => {
  try {
    const log = await Log.create({
      user_id: userId,
      user_type: userType,
      action: action,
      description: description,
      service_id: serviceId
    });

    return log;
  } catch (err) {
    console.error('Ошибка при записи лога:', err);
    throw new Error('Ошибка сервера');
  }
};

// Авторизация исполнителя (без пароля, только по Telegram ID)
export const loginExecuter = async (telegramId) => {
  try {
    if (!telegramId) {
      throw new Error('Telegram ID не указан');
    }

    const executer = await checkExecuter(telegramId);

    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    if (executer.status === 'blocked') {
      throw new Error('Аккаунт исполнителя заблокирован');
    }

    return executer;
  } catch (err) {
    console.error('Ошибка при входе исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Получение профиля исполнителя
export const getExecuterProfile = async (telegramId) => {
  try {
    const executer = await Executer.findOne({
  where: { telegram_id: String(telegramId) },
      attributes: ['id', 'name', 'telegram_id', 'rating', 'status', 'create_date_executer']
    });

    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    return executer;
  } catch (err) {
    console.error('Ошибка при получении профиля исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Обновление профиля исполнителя
export const updateExecuterProfile = async (telegramId, updateData) => {
  try {
    const executer = await Executer.findOne({
  where: { telegram_id: String(telegramId) }
    });

    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    // Разрешаем обновлять только определенные поля (статус исключен)
    const allowedFields = ['name'];
    const updateFields = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      throw new Error('Нет данных для обновления');
    }

    await Executer.update(updateFields, {
  where: { telegram_id: String(telegramId) }
    });

    const updatedExecuter = await getExecuterProfile(telegramId);
    return updatedExecuter;
  } catch (err) {
    console.error('Ошибка при обновлении профиля исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Обновление статуса исполнителя
export const updateExecuterStatus = async (telegramId, status) => {
  try {
    const validStatuses = ['active', 'inactive', 'busy', 'blocked'];

    if (!validStatuses.includes(status)) {
      throw new Error('Недопустимый статус');
    }

    const executer = await Executer.findOne({
  where: { telegram_id: String(telegramId) }
    });

    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    await Executer.update(
      { status: status },
  { where: { telegram_id: String(telegramId) } }
    );

    const updatedExecuter = await getExecuterProfile(telegramId);
    return updatedExecuter;
  } catch (err) {
    console.error('Ошибка при обновлении статуса исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Получение всех исполнителей (для админ панели)
export const getAllExecuters = async (filters = {}) => {
  try {
    const whereClause = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { telegram_id: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const executers = await Executer.findAll({
      where: whereClause,
      order: [['create_date_executer', 'DESC']],
      attributes: ['id', 'name', 'telegram_id', 'rating', 'status', 'create_date_executer']
    });

    return executers;
  } catch (err) {
    console.error('Ошибка при получении списка исполнителей:', err);
    throw new Error('Ошибка сервера');
  }
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ВЫПОЛНЕНИЯМИ УСЛУГ ==========

// Создать выполнение услуги (заменяет создание заказа)
export const createServiceExecution = async (serviceId, executerId, orderNumber) => {
  try {
    // Проверяем, есть ли уже такой номер заказа у этого исполнителя
    const existingExecution = await ServiceExecution.findOne({
      where: {
        executer_id: executerId,
        order_number: orderNumber
      }
    });

    if (existingExecution) {
      throw new Error('У вас уже есть заказ с таким номером');
    }

    // Проверяем доступ к услуге (новая система - прямое назначение)
    const directService = await Services.findOne({
      where: {
        id: serviceId,
        executer_id: executerId,
        status: 'active'
      }
    });

    // Если нет прямого доступа, проверяем старую систему
    if (!directService) {
      const hasAccess = await ServiceAccess.findOne({
        where: {
          service_id: serviceId,
          executer_id: executerId,
          has_access: true
        }
      });

      if (!hasAccess) {
        throw new Error('У вас нет доступа к этой услуге');
      }
    }

    // Создаем выполнение услуги
    const execution = await ServiceExecution.create({
      service_id: serviceId,
      executer_id: executerId,
      order_number: orderNumber,
      status: 'in_progress'
    });

    // Обновляем номер заказа в самой услуге
    const service = await Services.findByPk(serviceId);
    if (service) {
      await service.update({
        order_number: orderNumber
      });
    }

    // НЕ обновляем номер заказа во ВСЕХ материалах - это должно делаться только при автоназначении
    // или при явном выборе материала исполнителем.
    // Удаляем эту логику, чтобы не мешать автоназначению в executerRoute.js

    // // Обновляем номер заказа в материалах этой услуги
    // await Material.update(
    //   { order_number: orderNumber },
    //   {
    //     where: {
    //       service_id: serviceId,
    //       status: MATERIAL_STATUS.AVAILABLE
    //     }
    //   }
    // );

    // Записываем лог
    await createExecuterLog(
      executerId,
      'start_service_execution',
      `Начато выполнение услуги с номером заказа ${orderNumber}`,
      serviceId
    );

    return execution;
  } catch (err) {
    console.error('Ошибка при создании выполнения услуги:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Получить выполнение услуги по номеру заказа и исполнителю
export const getServiceExecution = async (orderNumber, executerId) => {
  try {
    const execution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executerId
      },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category', 'price']
        }
      ]
    });

    return execution;
  } catch (err) {
    console.error('Ошибка при получении выполнения услуги:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить все выполнения услуг исполнителя
export const getExecuterServiceExecutions = async (executerId, status = null) => {
  try {
    const whereCondition = { executer_id: executerId };
    if (status) {
      whereCondition.status = status;
    }

    const executions = await ServiceExecution.findAll({
      where: whereCondition,
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return executions;
  } catch (err) {
    console.error('Ошибка при получении выполнений услуг:', err);
    throw new Error('Ошибка сервера');
  }
};

// Совместимость: старый API ожидал getExecuterCompletedOrders
export const getExecuterCompletedOrders = async (executerId) => {
  // Переадресуем на новую функцию
  return getExecuterServiceExecutions(executerId, 'completed');
};


// Завершить выполнение услуги
export const completeServiceExecution = async (executionId, executerId) => {
  try {
    const execution = await ServiceExecution.findOne({
      where: {
        id: executionId,
        executer_id: executerId
      }
    });

    if (!execution) {
      throw new Error('Выполнение услуги не найдено');
    }

    if (execution.status === 'completed') {
      throw new Error('Услуга уже выполнена');
    }

    // Определяем цену выполнения: сначала индивидуальная цена исполнителя, иначе стандартная цена услуги
    let individualPrice = 0;
    try {
      const serviceAccess = await ServiceAccess.findOne({
        where: {
          executer_id: executerId,
          service_id: execution.service_id,
          has_access: true
        }
      });

      if (serviceAccess && typeof serviceAccess.price !== 'undefined' && serviceAccess.price !== null) {
        individualPrice = serviceAccess.price;
        console.log(`💰 Найдена индивидуальная цена для исполнителя ${executerId}: ${individualPrice}₽`);
      } else {
        const service = await Services.findByPk(execution.service_id);
        individualPrice = service?.price || 0;
        console.log(`💰 Использую стандартную цену услуги для исполнения ${executerId}: ${individualPrice}₽`);
      }
    } catch (priceErr) {
      console.warn('⚠️ Не удалось получить индивидуальную цену, использую 0:', priceErr.message);
      individualPrice = 0;
    }

    // Обновляем статус на завершенный и сохраняем цену выполнения
    await execution.update({
      status: 'completed',
      completed_at: new Date(),
      price: individualPrice
    });

    // Обновляем баланс исполнителя — добавляем цену выполнения
    try {
      const executer = await Executer.findByPk(executerId);
      if (executer) {
        await executer.update({
          balance: (executer.balance || 0) + (individualPrice || 0)
        });
      }
    } catch (balErr) {
      console.error('❌ Ошибка обновления баланса исполнителя:', balErr.message);
    }

    // Записываем лог
    await createExecuterLog(
      executerId,
      'complete_service_execution',
      `Завершено выполнение услуги с номером заказа ${execution.order_number}`,
      execution.service_id
    );

    return execution;
  } catch (err) {
    console.error('Ошибка при завершении выполнения услуги:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Совместимость: старый API ожидал completeOrder(orderId, executerId)
export const completeOrder = async (orderId, executerId) => {
  try {
    // Поддерживаем передачу как serviceExecution.id или order_number
    let execution = null;

    // Попробуем найти по id
    execution = await ServiceExecution.findOne({ where: { id: orderId, executer_id: executerId } });

    // Если не найдено, попробуем по order_number
    if (!execution) {
      execution = await ServiceExecution.findOne({ where: { order_number: orderId, executer_id: executerId } });
    }

    if (!execution) {
      throw new Error('Выполнение услуги не найдено');
    }

    // Используем новую функцию завершения, передавая internal id
    return await completeServiceExecution(execution.id, executerId);
  } catch (err) {
    console.error('Ошибка совместимости completeOrder:', err);
    throw err;
  }
};

// Отменить выполнение услуги (НЕ ВЫПОЛНИЛ ЗАКАЗ)
export const cancelServiceExecution = async (executionId, executerId, reason = null) => {
  try {
    const execution = await ServiceExecution.findOne({
      where: {
        id: executionId,
        executer_id: executerId
      }
    });

    if (!execution) {
      throw new Error('Выполнение услуги не найдено');
    }

    if (execution.status === 'completed') {
      throw new Error('Нельзя отменить уже выполненную услугу');
    }

    // Обновляем статус
    await execution.update({
      status: 'not_done',
      notes: reason || 'Отменено исполнителем',
      completed_at: new Date()
    });

    // Записываем лог
    await createExecuterLog(
      executerId,
      'cancel_service_execution',
      `Отменено выполнение услуги с номером заказа ${execution.order_number}. Причина: ${reason || 'Не указана'}`,
      execution.service_id
    );

    return execution;
  } catch (err) {
    console.error('Ошибка при отмене выполнения услуги:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Получить материалы для выполнения услуги
export const getServiceExecutionMaterials = async (executionId, executerId) => {
  try {
    const execution = await ServiceExecution.findOne({
      where: {
        id: executionId,
        executer_id: executerId
      },
      include: [
        {
          model: Services,
          attributes: ['id', 'name']
        }
      ]
    });

    if (!execution) {
      throw new Error('Выполнение услуги не найдено');
    }

    // Получаем материалы для услуги
    const materials = await Material.findAll({
      where: {
        service_id: execution.service_id,
        status: MATERIAL_STATUS.AVAILABLE
      }
    });

    // Обновляем номер заказа в материалах
    if (materials.length > 0) {
      await Material.update(
        { order_number: execution.order_number },
        {
          where: {
            service_id: execution.service_id,
            status: MATERIAL_STATUS.AVAILABLE
          }
        }
      );
    }

    return {
      execution,
      materials
    };
  } catch (err) {
    console.error('Ошибка при получении материалов:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// ========== DEPRECATED ФУНКЦИИ (для совместимости) ==========

export const getExecuterOrders = async (executerId, status = null) => {
  throw new Error('Функция getExecuterOrders устарела. Используйте getExecuterServiceExecutions');
};

export const getExecuterActiveOrders = async (executerId) => {
  throw new Error('Функция getExecuterActiveOrders устарела. Используйте getExecuterServiceExecutions');
};

export const getExecuterStats = async (executerId) => {
  throw new Error('Функция getExecuterStats устарела. Будет реализована для ServiceExecution');
};

export const getOrderById = async (orderId, executerId) => {
  throw new Error('Функция getOrderById устарела. Используйте getServiceExecution');
};

export const getMaterialsByOrder = async (orderId) => {
  throw new Error('Функция getMaterialsByOrder устарела. Используйте getServiceExecutionMaterials');
};

export const requestMaterialReplacement = async (orderId, executerId, reason, materialId = null) => {
  throw new Error('Функция requestMaterialReplacement будет обновлена для работы с ServiceExecution');
};

export const getAvailableMaterialsForReplacement = async (orderId, executerId) => {
  throw new Error('Функция getAvailableMaterialsForReplacement будет обновлена для работы с ServiceExecution');
};

export const createExecuterOrder = async (orderNumber, executerId) => {
  throw new Error('Функция createExecuterOrder устарела. Используйте createServiceExecution');
};

export const startOrderWork = async (orderId, executerId) => {
  throw new Error('Функция startOrderWork устарела. Используйте ServiceExecution');
};

export const acceptOrder = async (orderId, executerId) => {
  throw new Error('Функция acceptOrder устарела. Используйте ServiceExecution');
};
