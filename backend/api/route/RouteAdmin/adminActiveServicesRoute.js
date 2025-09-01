import express from 'express';
import * as ActiveServicesService from '../../service/ServiceAdmim/adminActiveServicesService.js';

const router = express.Router();

// Получить активные услуги исполнителя
router.get('/executer/:executerId/active', async (req, res) => {
  try {
    const { executerId } = req.params;
    const activeServices = await ActiveServicesService.getExecuterActiveServices(parseInt(executerId));
    res.json(activeServices);
  } catch (error) {
    console.error('Ошибка получения активных услуг:', error);
    res.status(500).json({ error: 'Ошибка получения активных услуг' });
  }
});

// Получить количество активных услуг исполнителя
router.get('/executer/:executerId/active/count', async (req, res) => {
  try {
    const { executerId } = req.params;
    const count = await ActiveServicesService.getExecuterActiveServicesCount(parseInt(executerId));
    res.json({ count });
  } catch (error) {
    console.error('Ошибка подсчета активных услуг:', error);
    res.status(500).json({ error: 'Ошибка подсчета активных услуг' });
  }
});

// Активировать услугу (для бота)
router.post('/activate', async (req, res) => {
  try {
    const { executer_id, service_id, order_number } = req.body;

    if (!executer_id || !service_id || !order_number) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id, service_id и order_number'
      });
    }

    const result = await ActiveServicesService.activateService(
      parseInt(executer_id),
      parseInt(service_id),
      order_number.toString()
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка активации услуги:', error);
    res.status(500).json({ error: error.message || 'Ошибка активации услуги' });
  }
});

// Завершить активную услугу
router.post('/complete', async (req, res) => {
  try {
    const { executer_id, order_number } = req.body;

    if (!executer_id || !order_number) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id и order_number'
      });
    }

    const result = await ActiveServicesService.completeService(
      parseInt(executer_id),
      order_number.toString()
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка завершения услуги:', error);
    res.status(500).json({ error: error.message || 'Ошибка завершения услуги' });
  }
});

// Проверить, может ли исполнитель активировать услугу
router.get('/executer/:executerId/can-activate', async (req, res) => {
  try {
    const { executerId } = req.params;
    const result = await ActiveServicesService.canExecuterActivateService(parseInt(executerId));
    res.json(result);
  } catch (error) {
    console.error('Ошибка проверки возможности активации:', error);
    res.status(500).json({ error: 'Ошибка проверки возможности активации' });
  }
});

// Установить лимит активных услуг
router.post('/executer/:executerId/limit', async (req, res) => {
  try {
    const { executerId } = req.params;
    const { limit } = req.body;

    if (limit === undefined) {
      return res.status(400).json({
        error: 'Необходимо указать limit'
      });
    }

    const result = await ActiveServicesService.setExecuterActiveServicesLimit(
      parseInt(executerId),
      limit === null ? null : parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка установки лимита:', error);
    res.status(500).json({ error: error.message || 'Ошибка установки лимита' });
  }
});

// Получить режим одобрений
router.get('/config/approval-mode', async (req, res) => {
  try {
    const mode = await ActiveServicesService.getApprovalMode();
    res.json({ mode });
  } catch (error) {
    console.error('Ошибка получения режима одобрений:', error);
    res.status(500).json({ error: 'Ошибка получения режима одобрений' });
  }
});

// Установить режим одобрений
router.post('/config/approval-mode', async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode || !['manual', 'auto_increment'].includes(mode)) {
      return res.status(400).json({
        error: 'Необходимо указать mode: manual или auto_increment'
      });
    }

    const result = await ActiveServicesService.setApprovalMode(mode);
    res.json(result);
  } catch (error) {
    console.error('Ошибка установки режима одобрений:', error);
    res.status(500).json({ error: 'Ошибка установки режима одобрений' });
  }
});

export default router;
