import { Executer, Order, Services, Material, Log, ServiceAccess, MaterialReplacement } from '../../../database/dbTables.js';
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
      `Заказ #${orderId} завершен`,
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

    const executer = await Executer.findOne({
      where: { telegram_id: telegramId }
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
    const whereCondition = { executer_id: executerId };

    // Если указан статус, добавляем его в условие
    if (status) {
      whereCondition.status = status;
    }

    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: Services,
          attributes: ['name', 'description']
        }
      ],
      order: [['created_at', 'DESC']]
    });

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
    console.error('Ошибка при получении заказов:', err);
    throw new Error('Ошибка сервера');
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
    const completedOrders = await Order.count({
      where: {
        executer_id: executerId,
        status: 'completed'
      }
    });

    const activeOrders = await Order.count({
      where: {
        executer_id: executerId,
        status: 'in_progress'
      }
    });

    const totalEarningsResult = await Order.sum('total_sum', {
      where: {
        executer_id: executerId,
        status: 'completed'
      }
    });

    const executer = await Executer.findByPk(executerId);

    const replacementRequests = await Log.count({
      where: {
        user_id: executerId,
        user_type: 'executer',
        action: 'request_replacement'
      }
    });

    return {
      completedOrders: completedOrders || 0,
      activeOrders: activeOrders || 0,
      totalEarnings: totalEarningsResult || 0,
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
    console.log(`🔍 Поиск материалов для заказа ID: ${orderId}`);

    const materials = await Material.findAll({
      where: { order_id: orderId }
    });

    console.log(`📦 Найдено материалов: ${materials.length}`);
    console.log(`📦 Детали материалов:`, materials.map(m => ({
      id: m.id,
      type_key: m.type_key,
      contents: m.contents,
      order_id: m.order_id
    })));

    return materials;
  } catch (err) {
    console.error('Ошибка при получении материалов:', err);
    throw new Error('Ошибка сервера');
  }
};

// Запросить замену материала
export const requestMaterialReplacement = async (orderId, executerId, reason) => {
  try {
    // Проверяем, что заказ существует и принадлежит исполнителю
    const order = await Order.findOne({
      where: { id: orderId, executer_id: executerId }
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Создаем запрос на замену материала
    const replacementRequest = await MaterialReplacement.create({
      order_id: orderId,
      executer_id: executerId,
      reason: reason,
      status: 'pending'
    });

    // Записываем лог запроса
    await createExecuterLog(
      executerId,
      'request_replacement',
      `Запрос замены материала: ${reason}`,
      orderId
    );

    // Обновляем активность
    await updateExecuterActivity(executerId);

    return { success: true, message: 'Запрос на замену отправлен', requestId: replacementRequest.id };
  } catch (err) {
    console.error('Ошибка при запросе замены:', err);
    throw new Error('Ошибка сервера');
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
