import express from 'express';
import { Executer, LimitApprovalRequest } from '../../../database/dbTables.js';
import * as ActiveServicesService from '../../service/ServiceAdmim/adminActiveServicesService.js';

const router = express.Router();

// Получить информацию о лимитах исполнителя для бота
router.get('/executer/:telegramId/limits', async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Находим исполнителя по telegram_id
    const executer = await Executer.findOne({
      where: { telegram_id: telegramId }
    });

    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Получаем информацию о возможности активации услуг
    const canActivate = await ActiveServicesService.canExecuterActivateService(executer.id);

    // Получаем список активных услуг
    const activeServices = await ActiveServicesService.getExecuterActiveServices(executer.id);

    res.json({
      executer_id: executer.id,
      telegram_id: telegramId,
      name: executer.name,
      status: executer.status,
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
        service_name: service.Service?.name,
        order_number: service.order_number,
        activated_at: service.activated_at
      }))
    });
  } catch (error) {
    console.error('Ошибка получения лимитов для бота:', error);
    res.status(500).json({ error: 'Ошибка получения информации о лимитах' });
  }
});

// Активировать услугу через бот (когда исполнитель вводит номер заказа)
router.post('/activate-service', async (req, res) => {
  try {
    const { telegram_id, service_id, order_number } = req.body;

    if (!telegram_id || !service_id || !order_number) {
      return res.status(400).json({
        error: 'Необходимо указать telegram_id, service_id и order_number'
      });
    }

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id }
    });

    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Активируем услугу
    const result = await ActiveServicesService.activateService(
      executer.id,
      parseInt(service_id),
      order_number.toString()
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        limits: {
          current_active: result.currentActive,
          max_limit: result.limit
        }
      });
    }

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
        order_number: result.activeService.order_number
      }
    });
  } catch (error) {
    console.error('Ошибка активации услуги через бот:', error);
    res.status(500).json({ error: error.message || 'Ошибка активации услуги' });
  }
});

// Завершить услугу через бот
router.post('/complete-service', async (req, res) => {
  try {
    const { telegram_id, order_number } = req.body;

    if (!telegram_id || !order_number) {
      return res.status(400).json({
        error: 'Необходимо указать telegram_id и order_number'
      });
    }

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id }
    });

    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Завершаем услугу
    const result = await ActiveServicesService.completeService(
      executer.id,
      order_number.toString()
    );

    res.json({
      success: true,
      message: `Заказ завершен! Активных услуг: ${result.currentActive}${result.limit ? `/${result.limit}` : '/∞'}`,
      limits: {
        current_active: result.currentActive,
        max_limit: result.limit
      },
      unblocked: result.unblocked || false
    });
  } catch (error) {
    console.error('Ошибка завершения услуги через бот:', error);
    res.status(500).json({ error: error.message || 'Ошибка завершения услуги' });
  }
});

// Запросить увеличение лимита через бот
router.post('/request-limit-increase', async (req, res) => {
  try {
    const { telegram_id, requested_limit, reason } = req.body;

    if (!telegram_id || !requested_limit) {
      return res.status(400).json({
        error: 'Необходимо указать telegram_id и requested_limit'
      });
    }

    // Находим исполнителя
    const executer = await Executer.findOne({
      where: { telegram_id }
    });

    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Создаем запрос на увеличение лимита (будем использовать существующую систему)
    // Для упрощения создадим запрос на общий лимит (service_id = null)
    const request = await LimitApprovalRequest.create({
      executer_id: executer.id,
      service_id: null, // общий лимит
      current_limit: executer.active_services_limit,
      requested_limit: parseInt(requested_limit),
      reason: reason || 'Запрос на увеличение лимита активных услуг',
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Запрос на увеличение лимита отправлен администратору',
      request_id: request.id,
      current_limit: executer.active_services_limit,
      requested_limit: parseInt(requested_limit)
    });
  } catch (error) {
    console.error('Ошибка создания запроса на увеличение лимита:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания запроса' });
  }
});

export default router;
