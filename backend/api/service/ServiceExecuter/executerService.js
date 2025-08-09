import { Executer, Order, Services, Material, Log, ServiceAccess, MaterialReplacement, ServiceExecution } from '../../../database/dbTables.js';
import { Op } from 'sequelize';

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
export const createExecuterLog = async (executerId, action, description, orderId = null, serviceId = null) => {
  try {
    await Log.create({
      user_id: executerId,
      user_type: 'executer',
      action: action,
      description: description,
      order_id: orderId,
      service_id: serviceId
    });
  } catch (err) {
    console.error('Ошибка при создании лога:', err);
  }
};

// Функция для завершения заказа
export const completeOrder = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId, executer_id: executerId }
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.status === 'completed') {
      throw new Error('Заказ уже завершен');
    }

    // Автоматически обновляем статус заказа и оплаты
    await order.update({
      status: 'completed',
      payment_status: 'paid'
    });

    // Обновляем статус всех материалов заказа на "использован"
    await Material.update(
      {
        status: 'used',
        used_date: new Date()
      },
      {
        where: { order_id: orderId }
      }
    );

    // Обновляем статус материалов в details заказа
    if (order.details && order.details.materials) {
      const updatedDetails = {
        ...order.details,
        materials: order.details.materials.map(material => ({
          ...material,
          status: 'used',
          used_date: new Date()
        }))
      };

      await order.update({
        details: updatedDetails
      });
    }

    // Обновляем баланс исполнителя
    const executer = await Executer.findByPk(executerId);
    if (executer) {
      await executer.update({
        balance: executer.balance + (order.total_sum || 0)
      });
    }

    // Создаем лог
    await createExecuterLog(
      executerId,
      'order_completed',
      `Заказ #${orderId} завершен, материалы помечены как использованные`,
      orderId,
      order.service_id
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    return order;
  } catch (err) {
    console.error('Ошибка при завершении заказа:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Функция для начала работы над заказом
export const startOrderWork = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId, executer_id: executerId }
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.status === 'completed') {
      throw new Error('Заказ уже завершен');
    }

    if (order.status === 'in_progress') {
      throw new Error('Заказ уже находится в работе');
    }

    // Обновляем статус заказа на "в работе"
    await order.update({
      status: 'in_progress'
    });

    // Создаем лог
    await createExecuterLog(
      executerId,
      'order_started',
      `Заказ #${orderId} взят в работу`,
      orderId,
      order.service_id
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    return order;
  } catch (err) {
    console.error('Ошибка при начале работы над заказом:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Функция для принятия заказа в работу
export const acceptOrder = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId, executer_id: executerId }
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.status !== 'pending') {
      throw new Error('Заказ нельзя принять в работу');
    }

    // Автоматически обновляем статус заказа
    await order.update({
      status: 'in_progress'
    });

    // Создаем лог
    await createExecuterLog(
      executerId,
      'order_accepted',
      `Заказ #${orderId} принят в работу`,
      orderId,
      order.service_id
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    return order;
  } catch (err) {
    console.error('Ошибка при принятии заказа:', err);
    throw new Error(err.message || 'Ошибка сервера');
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
      where: { telegram_id: telegramId }
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

    // Приводим telegram_id к строке для совместимости с базой данных
    const telegramIdStr = String(telegramId);

    const executer = await Executer.findOne({
      where: { telegram_id: telegramIdStr }
    });

    return executer;
  } catch (err) {
    console.error('Ошибка при проверке исполнителя:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить заказы исполнителя
export const getExecuterOrders = async (executerId, status = null) => {
  try {
    console.log('\n🔥 === SERVICE: ПОЛУЧЕНИЕ ЗАКАЗОВ ===');
    console.log(`👤 Executer ID: ${executerId}`);
    console.log(`📊 Status filter: ${status}`);

    const whereCondition = { executer_id: executerId };

    // Если указан статус, добавляем его в условие
    if (status) {
      whereCondition.status = status;
    }

    // Используем ServiceExecution вместо Order
    const orders = await ServiceExecution.findAll({
      where: whereCondition,
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['name', 'description', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Найдено заказов: ${orders ? orders.length : 0}`);
    console.log(`📊 Данные заказов:`, JSON.stringify(orders, null, 2));

    // Логируем активность просмотра заказов
    const logAction = status === 'completed' ? 'view_completed_orders' : 'view_orders';
    const logDescription = status === 'completed' ? 'Просмотр выполненных заказов' : 'Просмотр списка заказов';

    await createExecuterLog(
      executerId,
      logAction,
      logDescription
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    return orders;
  } catch (err) {
    console.error('❌ SERVICE: Ошибка при получении заказов:', err);
    console.error('❌ SERVICE: Stack trace:', err.stack);
    throw new Error('Ошибка сервера');
  }
};

// Получить активные заказы исполнителя
export const getExecuterActiveOrders = async (executerId) => {
  try {
    console.log('\n🔥 === SERVICE: ПОЛУЧЕНИЕ АКТИВНЫХ ЗАКАЗОВ ===');
    console.log(`👤 Executer ID: ${executerId}`);

    const logAction = 'get_orders';
    const logDescription = `Получение активных заказов исполнителем ID: ${executerId}`;

    // Ищем в ServiceExecution вместо Order
    const orders = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: ['pending', 'in_progress', 'active'] // активные статусы
      },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['name', 'description', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Найдено ServiceExecution записей: ${orders ? orders.length : 0}`);
    console.log(`📊 Данные активных заказов:`, JSON.stringify(orders, null, 2));

    await createExecuterLog(
      executerId,
      logAction,
      logDescription
    );

    await updateExecuterActivity(executerId);

    return orders;
  } catch (error) {
    console.error('❌ SERVICE: Ошибка получения активных заказов:', error);
    console.error('❌ SERVICE: Stack trace:', error.stack);
    throw error;
  }
};

// Получить завершенные заказы исполнителя
export const getExecuterCompletedOrders = async (executerId) => {
  try {
    console.log('\n✅ === SERVICE: ПОЛУЧЕНИЕ ЗАВЕРШЕННЫХ ЗАКАЗОВ ===');
    console.log(`👤 Executer ID: ${executerId}`);

    const logAction = 'get_completed_orders';
    const logDescription = `Получение завершенных заказов исполнителем ID: ${executerId}`;

    // Ищем в ServiceExecution вместо Order
    const orders = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: 'completed' // только завершенные
      },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['name', 'description', 'price']
        }
      ],
      order: [['updated_at', 'DESC']] // сортируем по дате завершения
    });

    console.log(`✅ Найдено завершенных ServiceExecution записей: ${orders ? orders.length : 0}`);
    console.log(`📊 Данные завершенных заказов:`, JSON.stringify(orders, null, 2));

    await createExecuterLog(
      executerId,
      logAction,
      logDescription
    );

    await updateExecuterActivity(executerId);

    return orders;
  } catch (error) {
    console.error('❌ SERVICE: Ошибка получения завершенных заказов:', error);
    console.error('❌ SERVICE: Stack trace:', error.stack);
    throw error;
  }
};

// Получить доступные услуги для исполнителя
export const getExecuterServices = async (executerId) => {
  try {
    const serviceAccess = await ServiceAccess.findAll({
      where: {
        executer_id: executerId,
        has_access: true
      },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'price']
        }
      ]
    });

    return serviceAccess.map(access => access.Service);
  } catch (err) {
    console.error('Ошибка при получении услуг:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить статистику исполнителя
export const getExecuterStats = async (executerId) => {
  try {
    const completedExecutions = await ServiceExecution.count({
      where: {
        executer_id: executerId,
        status: 'completed'
      }
    });

    const activeExecutions = await ServiceExecution.count({
      where: {
        executer_id: executerId,
        status: 'in_progress'
      }
    });

    // Подсчитываем общий заработок через индивидуальные цены из ServiceExecution
    const completedServices = await ServiceExecution.findAll({
      where: {
        executer_id: executerId,
        status: 'completed'
      },
      include: [{
        model: Services,
        attributes: ['name', 'price']
      }]
    });

    console.log(`💰 Расчет заработка: найдено ${completedServices.length} выполненных заказов`);

    const totalEarnings = completedServices.reduce((sum, execution) => {
      // Используем индивидуальную цену из ServiceExecution, если она есть
      const individualPrice = execution.price || execution.Service?.price || 0;
      console.log(`💰 Заказ #${execution.order_number}: цена ${individualPrice}₽ (индивидуальная: ${execution.price}₽, стандартная: ${execution.Service?.price}₽)`);
      return sum + individualPrice;
    }, 0);

    console.log(`💰 Расчет заработка: найдено ${completedServices.length} выполненных заказов, общая сумма: ${totalEarnings}₽`);

    const executer = await Executer.findByPk(executerId);

    const replacementRequests = await Log.count({
      where: {
        user_id: executerId,
        user_type: 'executer',
        action: 'request_replacement'
      }
    });

    return {
      completedOrders: completedExecutions || 0,
      activeOrders: activeExecutions || 0,
      totalEarnings: totalEarnings || 0,
      rating: executer?.rating || 0,
      replacementRequests: replacementRequests || 0
    };
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
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

// Получить заказ по ID
export const getOrderById = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: executerId
      },
      include: [
        {
          model: Services,
          attributes: ['name', 'description']
        }
      ]
    });

    if (!order) {
      return null;
    }

    // Если в details есть материалы, загружаем их полные данные
    if (order.details && order.details.materials && Array.isArray(order.details.materials)) {
      console.log(`🔍 Загружаем полные данные для материалов из details:`, order.details.materials);

      // Если materials содержит ID материалов, загружаем их
      if (order.details.materials.length > 0 && typeof order.details.materials[0] === 'number') {
        const materialIds = order.details.materials;
        const fullMaterials = await Material.findAll({
          where: {
            id: materialIds
          }
        });

        console.log(`📦 Найдено полных материалов: ${fullMaterials.length}`);

        // Обновляем details с полными данными материалов
        order.details = {
          ...order.details,
          materials: fullMaterials.map(material => ({
            id: material.id,
            type_key: material.type_key,
            contents: material.contents,
            status: material.status,
            source: material.source,
            added_date: material.added_date
          }))
        };
      }
    }

    return order;
  } catch (err) {
    console.error('Ошибка при получении заказа:', err);
    throw new Error('Ошибка сервера');
  }
};

// Получить материалы по заказу
export const getMaterialsByOrder = async (orderId) => {
  try {
    console.log(`🔍 Поиск материалов для заказа номер: ${orderId}`);

    const materials = await Material.findAll({
      where: { order_number: orderId }
    });

    console.log(`📦 Найдено материалов: ${materials.length}`);
    console.log(`📦 Детали материалов:`, materials.map(m => ({
      id: m.id,
      type_key: m.type_key,
      contents: m.contents,
      order_number: m.order_number
    })));

    return materials;
  } catch (err) {
    console.error('Ошибка при получении материалов:', err);
    throw new Error('Ошибка сервера');
  }
};

// Запросить замену материала
export const requestMaterialReplacement = async (orderNumber, materialId, executerId, reason) => {
  try {
    // Находим ServiceExecution по номеру заказа
    const serviceExecution = await ServiceExecution.findOne({
      where: {
        order_number: orderNumber,
        executer_id: executerId
      },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!serviceExecution) {
      throw new Error('Заказ не найден');
    }

    // Проверяем материал
    const material = await Material.findByPk(materialId);
    if (!material) {
      throw new Error('Материал не найден');
    }

    // Создаем запрос на замену материала
    const replacementRequest = await MaterialReplacement.create({
      order_id: serviceExecution.id, // Используем ID ServiceExecution как order_id
      executer_id: executerId,
      material_id: materialId,
      reason: reason,
      status: 'pending'
    });

    // Меняем статус материала на "ожидает замену"
    await Material.update(
      { status: 'pending_replace' },
      { where: { id: materialId } }
    );

    // Записываем лог запроса
    await createExecuterLog(
      executerId,
      'request_replacement',
      `Запрос замены материала для заказа #${orderNumber}: ${reason}`,
      serviceExecution.id,
      serviceExecution.service_id
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    console.log(`✅ Запрос замены создан для заказа #${orderNumber}, материал ${materialId}`);

    return replacementRequest;
  } catch (err) {
    console.error('Ошибка при запросе замены:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Записать лог
export const writeExecuterLog = async (userId, userType, action, description, orderId = null, serviceId = null) => {
  try {
    const log = await Log.create({
      user_id: userId,
      user_type: userType,
      action: action,
      description: description,
      order_id: orderId,
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
      where: { telegram_id: telegramId },
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
      where: { telegram_id: telegramId }
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
      where: { telegram_id: telegramId }
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
      where: { telegram_id: telegramId }
    });

    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    await Executer.update(
      { status: status },
      { where: { telegram_id: telegramId } }
    );

    const updatedExecuter = await getExecuterProfile(telegramId);
    return updatedExecuter;
  } catch (err) {
    console.error('Ошибка при обновлении статуса исполнителя:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};

// Получить доступные материалы для замены
export const getAvailableMaterialsForReplacement = async (orderId, executerId) => {
  try {
    // Проверяем доступ к заказу
    const order = await Order.findOne({
      where: { id: orderId, executer_id: executerId }
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Получаем доступные материалы того же типа услуги
    const availableMaterials = await Material.findAll({
      where: {
        service_id: order.service_id,
        status: 'available'
      },
      order: [['added_date', 'DESC']]
    });

    return availableMaterials;
  } catch (err) {
    console.error('Ошибка при получении доступных материалов:', err);
    throw new Error('Ошибка сервера');
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

// Создать новый заказ
export const createExecuterOrder = async (orderNumber, executerId) => {
  try {
    // Проверяем, что исполнитель существует
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    // Проверяем, не существует ли уже заказ с таким номером для этого исполнителя
    const existingOrder = await Order.findOne({
      where: {
        id: orderNumber,
        executer_id: executerId
      }
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Создаём новый заказ
    const newOrder = await Order.create({
      id: orderNumber, // Используем номер заказа как ID
      executer_id: executerId,
      status: 'pending',
      payment_status: 'pending',
      total_sum: 0, // Сумма будет устанавливаться позже
      details: {
        created_by_executer: true,
        order_number: orderNumber
      }
    });

    // Обновляем активность исполнителя
    await updateExecuterActivity(executerId);

    // Записываем лог
    await createExecuterLog(
      executerId,
      'create_order',
      `Создан заказ #${orderNumber}`,
      orderNumber
    );

    return newOrder;
  } catch (err) {
    console.error('Ошибка при создании заказа:', err);
    throw new Error('Ошибка сервера');
  }
};

// Функция для создания выполнения услуги
export const createServiceExecution = async (serviceId, executerId, orderNumber) => {
  try {
    console.log('\n🎯 === СОЗДАНИЕ ВЫПОЛНЕНИЯ УСЛУГИ ===');
    console.log('📊 Параметры:', { serviceId, executerId, orderNumber });

    // Импортируем ServiceExecution
    const { ServiceExecution } = await import('../../../database/dbTables.js');

    // Проверяем существование услуги
    const service = await Services.findByPk(serviceId);
    if (!service) {
      throw new Error('Услуга не найдена');
    }

    // Проверяем существование исполнителя
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    // Получаем индивидуальную цену исполнителя для данной услуги
    let individualPrice = service.price; // По умолчанию стандартная цена

    try {
      const serviceAccess = await ServiceAccess.findOne({
        where: {
          executer_id: executerId,
          service_id: serviceId,
          status: 'active'
        }
      });

      if (serviceAccess && serviceAccess.price !== null) {
        individualPrice = serviceAccess.price;
        console.log(`💰 Использую индивидуальную цену для исполнителя ${executerId}: ${individualPrice}₽ (стандартная: ${service.price}₽)`);
      } else {
        console.log(`💰 Использую стандартную цену для услуги: ${individualPrice}₽`);
      }
    } catch (priceError) {
      console.error('⚠️ Ошибка получения индивидуальной цены, использую стандартную:', priceError.message);
    }

    // Проверяем, есть ли уже выполнение с таким номером заказа
    const existingExecution = await ServiceExecution.findOne({
      where: { order_number: orderNumber }
    });

    if (existingExecution) {
      throw new Error(`Заказ с номером ${orderNumber} уже существует`);
    }

    // Создаём выполнение услуги с индивидуальной ценой
    const execution = await ServiceExecution.create({
      service_id: serviceId,
      executer_id: executerId,
      order_number: orderNumber,
      price: individualPrice, // Сохраняем индивидуальную цену
      status: 'in_progress',
      created_at: new Date()
    });

    console.log(`✅ Выполнение услуги создано: ${execution.id} с ценой ${individualPrice}₽`);

    // Обновляем активность исполнителя
    await updateExecuterActivity(executerId);

    // Записываем лог
    await createExecuterLog(
      executerId,
      'create_service_execution',
      `Создано выполнение услуги "${service.name}" для заказа #${orderNumber} с ценой ${individualPrice}₽`,
      null,
      serviceId
    );

    return execution;
  } catch (err) {
    console.error('❌ Ошибка при создании выполнения услуги:', err);
    throw new Error(err.message || 'Ошибка сервера');
  }
};
