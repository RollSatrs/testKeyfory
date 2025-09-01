import { ExecuterLimits, LimitApprovalRequest, Executer, Services } from '../../../database/dbTables.js';
import { Op } from 'sequelize';

// Получить все лимиты исполнителей
export async function getAllExecuterLimits() {
  try {
    const limits = await ExecuterLimits.findAll({
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ],
      order: [['executer_id', 'ASC'], ['service_id', 'ASC']]
    });

    return limits;
  } catch (error) {
    console.error('Ошибка получения лимитов исполнителей:', error);
    throw error;
  }
}

// Получить лимиты конкретного исполнителя
export async function getExecuterLimits(executerId) {
  try {
    const limits = await ExecuterLimits.findAll({
      where: { executer_id: executerId },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ],
      order: [['service_id', 'ASC']]
    });

    return limits;
  } catch (error) {
    console.error('Ошибка получения лимитов исполнителя:', error);
    throw error;
  }
}

// Получить лимит для конкретной пары исполнитель-услуга
export async function getExecuterServiceLimit(executerId, serviceId) {
  try {
    const limit = await ExecuterLimits.findOne({
      where: {
        executer_id: executerId,
        service_id: serviceId
      },
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ]
    });

    // Если лимит не найден, создаем дефолтный
    if (!limit) {
      const executer = await Executer.findByPk(executerId);
      const service = await Services.findByPk(serviceId);

      if (!executer || !service) {
        throw new Error('Исполнитель или услуга не найдены');
      }

      // Определяем дефолтный лимит в зависимости от "опыта" исполнителя
      const executerAge = new Date() - new Date(executer.created_at);
      const daysOld = executerAge / (1000 * 60 * 60 * 24);

      let defaultLimit = 3; // новички
      if (daysOld > 90) defaultLimit = 25; // опытные
      else if (daysOld > 30) defaultLimit = 10; // средние

      const newLimit = await ExecuterLimits.create({
        executer_id: executerId,
        service_id: serviceId,
        max_limit: defaultLimit,
        current_active: 0
      });

      return await ExecuterLimits.findByPk(newLimit.id, {
        include: [
          {
            model: Executer,
            as: 'Executer',
            attributes: ['id', 'name', 'telegram_id', 'status']
          },
          {
            model: Services,
            as: 'Service',
            attributes: ['id', 'name', 'category', 'status']
          }
        ]
      });
    }

    return limit;
  } catch (error) {
    console.error('Ошибка получения лимита исполнителя для услуги:', error);
    throw error;
  }
}

// Обновить лимит исполнителя
export async function updateExecuterLimit(id, updateData) {
  try {
    const limit = await ExecuterLimits.findByPk(id);
    if (!limit) {
      throw new Error('Лимит не найден');
    }

    const updatedLimit = await limit.update({
      ...updateData,
      updated_at: new Date()
    });

    return await ExecuterLimits.findByPk(updatedLimit.id, {
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ]
    });
  } catch (error) {
    console.error('Ошибка обновления лимита исполнителя:', error);
    throw error;
  }
}

// Создать или обновить лимит исполнителя для услуги
export async function setExecuterServiceLimit(executerId, serviceId, maxOrders, notes = '') {
  try {
    const [limit, created] = await ExecuterLimits.findOrCreate({
      where: {
        executer_id: executerId,
        service_id: serviceId
      },
      defaults: {
        max_limit: maxOrders,
        current_active: 0
      }
    });

    if (!created) {
      await limit.update({
        max_limit: maxOrders,
        updated_at: new Date()
      });
    }

    return await ExecuterLimits.findByPk(limit.id, {
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ]
    });
  } catch (error) {
    console.error('Ошибка установки лимита исполнителя:', error);
    throw error;
  }
}

// Увеличить счетчик активных заказов
export async function incrementActiveOrders(executerId, serviceId) {
  try {
    const limit = await getExecuterServiceLimit(executerId, serviceId);

    const updatedCount = limit.current_active + 1;
    const shouldBlock = limit.max_limit !== null && updatedCount >= limit.max_limit;

    await limit.update({
      current_active: updatedCount,
      updated_at: new Date()
    });

    // Если превышен лимит, блокируем исполнителя
    if (shouldBlock) {
      await blockExecuter(executerId, `Превышен лимит заказов: ${updatedCount}/${limit.max_limit}`);
    }

    return {
      ...limit.toJSON(),
      current_active: updatedCount,
      is_blocked: shouldBlock,
      limit_exceeded: shouldBlock
    };
  } catch (error) {
    console.error('Ошибка увеличения счетчика активных заказов:', error);
    throw error;
  }
}

// Уменьшить счетчик активных заказов (когда заказ завершен)
export async function decrementActiveOrders(executerId, serviceId) {
  try {
    const limit = await getExecuterServiceLimit(executerId, serviceId);

    const updatedCount = Math.max(0, limit.current_active - 1);

    await limit.update({
      current_active: updatedCount,
      updated_at: new Date()
    });

    // Если исполнитель был заблокирован из-за лимита, разблокируем его
    const executer = await Executer.findByPk(executerId);
    if (executer.status === 'blocked' && limit.max_limit !== null && updatedCount < limit.max_limit) {
      await executer.update({
        status: 'active'
      });
    }

    return {
      ...limit.toJSON(),
      current_active: updatedCount
    };
  } catch (error) {
    console.error('Ошибка уменьшения счетчика активных заказов:', error);
    throw error;
  }
}

// Заблокировать исполнителя
export async function blockExecuter(executerId, reason = 'Превышен лимит заказов') {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    await executer.update({
      status: 'blocked'
    });

    console.log(`Исполнитель ${executer.name} (ID: ${executerId}) заблокирован: ${reason}`);

    return executer;
  } catch (error) {
    console.error('Ошибка блокировки исполнителя:', error);
    throw error;
  }
}

// Разблокировать исполнителя
export async function unblockExecuter(executerId) {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    await executer.update({
      status: 'active'
    });

    console.log(`Исполнитель ${executer.name} (ID: ${executerId}) разблокирован`);

    return executer;
  } catch (error) {
    console.error('Ошибка разблокировки исполнителя:', error);
    throw error;
  }
}

// Проверить, может ли исполнитель взять заказ
export async function canExecuterTakeOrder(executerId, serviceId) {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    // Проверяем статус исполнителя
    if (executer.status === 'blocked') {
      return {
        canTake: false,
        reason: 'Исполнитель заблокирован',
        isBlocked: true
      };
    }

    const limit = await getExecuterServiceLimit(executerId, serviceId);

    // Если лимит не установлен (null), исполнитель может взять любое количество заказов
    if (limit.max_limit === null) {
      return {
        canTake: true,
        remainingOrders: '∞',
        currentActive: limit.current_active,
        maxOrders: '∞',
        isBlocked: false,
        limit
      };
    }

    const canTake = limit.current_active < limit.max_limit;
    const remainingOrders = Math.max(0, limit.max_limit - limit.current_active);

    return {
      canTake,
      remainingOrders,
      currentActive: limit.current_active,
      maxOrders: limit.max_limit,
      isBlocked: false,
      limit
    };
  } catch (error) {
    console.error('Ошибка проверки возможности взять заказ:', error);
    throw error;
  }
}

// Создать запрос на увеличение лимита
export async function createLimitIncreaseRequest(executerId, serviceId, requestedLimit, reason) {
  try {
    const currentLimit = await getExecuterServiceLimit(executerId, serviceId);

    // Проверяем, есть ли уже активный запрос
    const existingRequest = await LimitApprovalRequest.findOne({
      where: {
        executer_id: executerId,
        service_id: serviceId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      throw new Error('Уже существует активный запрос на увеличение лимита');
    }

    const request = await LimitApprovalRequest.create({
      executer_id: executerId,
      service_id: serviceId,
      current_limit: currentLimit.max_limit,
      requested_limit: requestedLimit,
      reason: reason || 'Запрос на увеличение лимита',
      status: 'pending'
    });

    return await LimitApprovalRequest.findByPk(request.id, {
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ]
    });
  } catch (error) {
    console.error('Ошибка создания запроса на увеличение лимита:', error);
    throw error;
  }
}

// Получить все запросы на увеличение лимита
export async function getAllLimitRequests(status = null) {
  try {
    const whereCondition = status ? { status } : {};

    const requests = await LimitApprovalRequest.findAll({
      where: whereCondition,
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return requests;
  } catch (error) {
    console.error('Ошибка получения запросов на увеличение лимита:', error);
    throw error;
  }
}

// Обработать запрос на увеличение лимита
export async function processLimitRequest(requestId, adminId, status, adminResponse, newLimit = null) {
  try {
    const request = await LimitApprovalRequest.findByPk(requestId);
    if (!request) {
      throw new Error('Запрос не найден');
    }

    await request.update({
      status,
      admin_id: adminId,
      admin_response: adminResponse || '',
      processed_at: new Date()
    });

    if (status === 'approved' && newLimit) {
      // Обновляем лимит исполнителя
      await setExecuterServiceLimit(
        request.executer_id,
        request.service_id,
        newLimit
      );

      // Если исполнитель был заблокирован из-за превышения лимита, разблокируем его
      const limit = await getExecuterServiceLimit(request.executer_id, request.service_id);
      if (limit.current_active < newLimit) {
        await unblockExecuter(request.executer_id);
      }
    }

    return await LimitApprovalRequest.findByPk(requestId, {
      include: [
        {
          model: Executer,
          as: 'Executer',
          attributes: ['id', 'name', 'telegram_id', 'status']
        },
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ]
    });
  } catch (error) {
    console.error('Ошибка обработки запроса на увеличение лимита:', error);
    throw error;
  }
}
