import { ExecuterActiveServices, Executer, Services, SystemConfig } from '../../../database/dbTables.js';
import { Op } from 'sequelize';

// Получить все активные услуги исполнителя
export async function getExecuterActiveServices(executerId) {
  try {
    const activeServices = await ExecuterActiveServices.findAll({
      where: {
        executer_id: executerId,
        status: 'active'
      },
      include: [
        {
          model: Services,
          as: 'Service',
          attributes: ['id', 'name', 'category', 'status']
        }
      ],
      order: [['activated_at', 'DESC']]
    });

    return activeServices;
  } catch (error) {
    console.error('Ошибка получения активных услуг исполнителя:', error);
    throw error;
  }
}

// Получить количество активных услуг исполнителя
export async function getExecuterActiveServicesCount(executerId) {
  try {
    const count = await ExecuterActiveServices.count({
      where: {
        executer_id: executerId,
        status: 'active'
      }
    });

    return count;
  } catch (error) {
    console.error('Ошибка подсчета активных услуг:', error);
    throw error;
  }
}

// Активировать услугу для исполнителя (когда он указал номер заказа)
export async function activateService(executerId, serviceId, orderNumber) {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    // Проверяем лимит активных услуг
    const canActivate = await canExecuterActivateService(executerId);
    if (!canActivate.allowed) {
      return {
        success: false,
        error: canActivate.reason,
        currentActive: canActivate.currentActive,
        limit: canActivate.limit
      };
    }

    // Проверяем, не активирована ли уже эта услуга с таким номером заказа
    const existing = await ExecuterActiveServices.findOne({
      where: {
        executer_id: executerId,
        order_number: orderNumber
      }
    });

    if (existing) {
      throw new Error('Заказ с таким номером уже активирован');
    }

    // Активируем услугу
    const activeService = await ExecuterActiveServices.create({
      executer_id: executerId,
      service_id: serviceId,
      order_number: orderNumber,
      status: 'active'
    });

    // Получаем обновленную информацию
    const newCount = await getExecuterActiveServicesCount(executerId);

    // Проверяем, не достиг ли исполнитель лимита
    if (executer.active_services_limit && newCount >= executer.active_services_limit) {
      await executer.update({ status: 'blocked' });
      console.log(`Исполнитель ${executer.name} заблокирован: достиг лимита активных услуг (${newCount}/${executer.active_services_limit})`);
    }

    return {
      success: true,
      activeService: await ExecuterActiveServices.findByPk(activeService.id, {
        include: [{ model: Services, as: 'Service' }]
      }),
      currentActive: newCount,
      limit: executer.active_services_limit
    };
  } catch (error) {
    console.error('Ошибка активации услуги:', error);
    throw error;
  }
}

// Завершить активную услугу (когда заказ выполнен)
export async function completeService(executerId, orderNumber) {
  try {
    const activeService = await ExecuterActiveServices.findOne({
      where: {
        executer_id: executerId,
        order_number: orderNumber,
        status: 'active'
      }
    });

    if (!activeService) {
      throw new Error('Активная услуга с таким номером заказа не найдена');
    }

    // Завершаем услугу
    await activeService.update({
      status: 'completed',
      updated_at: new Date()
    });

    // Проверяем, можно ли разблокировать исполнителя
    const executer = await Executer.findByPk(executerId);
    const newCount = await getExecuterActiveServicesCount(executerId);

    if (executer.status === 'blocked' &&
        executer.active_services_limit &&
        newCount < executer.active_services_limit) {
      await executer.update({ status: 'active' });
      console.log(`Исполнитель ${executer.name} разблокирован: количество активных услуг меньше лимита (${newCount}/${executer.active_services_limit})`);
    }

    return {
      success: true,
      currentActive: newCount,
      limit: executer.active_services_limit,
      unblocked: executer.status === 'blocked' && newCount < (executer.active_services_limit || Infinity)
    };
  } catch (error) {
    console.error('Ошибка завершения услуги:', error);
    throw error;
  }
}

// Проверить, может ли исполнитель активировать новую услугу
export async function canExecuterActivateService(executerId) {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      return { allowed: false, reason: 'Исполнитель не найден' };
    }

    if (executer.status === 'blocked') {
      return {
        allowed: false,
        reason: 'Исполнитель заблокирован',
        currentActive: 0,
        limit: executer.active_services_limit
      };
    }

    const currentActive = await getExecuterActiveServicesCount(executerId);

    // Если лимит не установлен (null), можно активировать любое количество
    if (executer.active_services_limit === null) {
      return {
        allowed: true,
        currentActive: currentActive,
        limit: null
      };
    }

    // Проверяем лимит
    if (currentActive >= executer.active_services_limit) {
      return {
        allowed: false,
        reason: `Достигнут лимит активных услуг (${currentActive}/${executer.active_services_limit})`,
        currentActive: currentActive,
        limit: executer.active_services_limit
      };
    }

    return {
      allowed: true,
      currentActive: currentActive,
      limit: executer.active_services_limit,
      remaining: executer.active_services_limit - currentActive
    };
  } catch (error) {
    console.error('Ошибка проверки возможности активации:', error);
    throw error;
  }
}

// Установить лимит активных услуг для исполнителя
export async function setExecuterActiveServicesLimit(executerId, limit) {
  try {
    const executer = await Executer.findByPk(executerId);
    if (!executer) {
      throw new Error('Исполнитель не найден');
    }

    await executer.update({
      active_services_limit: limit === 0 ? null : limit // 0 означает безлимитный
    });

    // Если лимит увеличен и исполнитель был заблокирован, проверяем разблокировку
    const currentActive = await getExecuterActiveServicesCount(executerId);
    if (executer.status === 'blocked' && (limit === null || currentActive < limit)) {
      await executer.update({ status: 'active' });
    }

    return {
      success: true,
      limit: limit === 0 ? null : limit,
      currentActive: currentActive
    };
  } catch (error) {
    console.error('Ошибка установки лимита:', error);
    throw error;
  }
}

// Получить настройку системы одобрений
export async function getApprovalMode() {
  try {
    const config = await SystemConfig.findOne({
      where: { config_key: 'executer_limit_approval_mode' }
    });

    return config?.config_value || 'manual';
  } catch (error) {
    console.error('Ошибка получения режима одобрений:', error);
    return 'manual';
  }
}

// Установить настройку системы одобрений
export async function setApprovalMode(mode) {
  try {
    const [config] = await SystemConfig.findOrCreate({
      where: { config_key: 'executer_limit_approval_mode' },
      defaults: {
        config_value: mode,
        description: 'Режим одобрения лимитов: manual (админ указывает новый лимит) или auto_increment (прибавляется к текущему)'
      }
    });

    if (!config.isNewRecord) {
      await config.update({ config_value: mode });
    }

    return { success: true, mode };
  } catch (error) {
    console.error('Ошибка установки режима одобрений:', error);
    throw error;
  }
}

// Обработать запрос на увеличение лимита с учетом режима одобрений
export async function processLimitIncreaseRequest(requestId, adminId, approved, newLimit = null) {
  try {
    const request = await LimitApprovalRequest.findByPk(requestId, {
      include: [{ model: Executer, as: 'Executer' }]
    });

    if (!request) {
      throw new Error('Запрос не найден');
    }

    if (!approved) {
      await request.update({
        status: 'rejected',
        admin_id: adminId,
        admin_response: 'Запрос отклонен администратором',
        processed_at: new Date()
      });
      return { success: true, approved: false };
    }

    // Получаем режим одобрений
    const approvalMode = await getApprovalMode();
    let finalLimit;

    if (approvalMode === 'auto_increment') {
      // Автоматическое увеличение: прибавляем к текущему лимиту изначальное значение
      const currentLimit = request.Executer.active_services_limit || 0;
      const originalLimit = currentLimit; // или можно сохранять изначальный лимит отдельно
      finalLimit = currentLimit + (originalLimit || 2); // по умолчанию +2 если не было лимита
    } else {
      // Ручной режим: используем лимит, указанный администратором
      if (newLimit === null || newLimit === undefined) {
        throw new Error('В ручном режиме необходимо указать новый лимит');
      }
      finalLimit = newLimit;
    }

    // Устанавливаем новый лимит
    await setExecuterActiveServicesLimit(request.executer_id, finalLimit);

    // Обновляем запрос
    await request.update({
      status: 'approved',
      admin_id: adminId,
      admin_response: `Лимит увеличен до ${finalLimit} (режим: ${approvalMode})`,
      processed_at: new Date()
    });

    return {
      success: true,
      approved: true,
      newLimit: finalLimit,
      mode: approvalMode
    };
  } catch (error) {
    console.error('Ошибка обработки запроса на увеличение лимита:', error);
    throw error;
  }
}
