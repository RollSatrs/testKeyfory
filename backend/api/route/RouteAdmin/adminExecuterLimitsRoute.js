import express from 'express';
import * as ExecuterLimitsService from '../../service/ServiceAdmim/adminExecuterLimitsService.js';

const router = express.Router();

// Получить все лимиты исполнителей
router.get('/limits', async (req, res) => {
  try {
    const limits = await ExecuterLimitsService.getAllExecuterLimits();
    res.json(limits);
  } catch (error) {
    console.error('Ошибка получения лимитов:', error);
    res.status(500).json({ error: 'Ошибка получения лимитов исполнителей' });
  }
});

// Получить лимиты конкретного исполнителя
router.get('/limits/executer/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const limits = await ExecuterLimitsService.getExecuterLimits(parseInt(executerId));
    res.json(limits);
  } catch (error) {
    console.error('Ошибка получения лимитов исполнителя:', error);
    res.status(500).json({ error: 'Ошибка получения лимитов исполнителя' });
  }
});

// Получить лимит для конкретной пары исполнитель-услуга
router.get('/limits/executer/:executerId/service/:serviceId', async (req, res) => {
  try {
    const { executerId, serviceId } = req.params;
    const limit = await ExecuterLimitsService.getExecuterServiceLimit(
      parseInt(executerId),
      parseInt(serviceId)
    );
    res.json(limit);
  } catch (error) {
    console.error('Ошибка получения лимита:', error);
    res.status(500).json({ error: 'Ошибка получения лимита исполнителя' });
  }
});

// Обновить лимит исполнителя
router.put('/limits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedLimit = await ExecuterLimitsService.updateExecuterLimit(
      parseInt(id),
      updateData
    );

    res.json(updatedLimit);
  } catch (error) {
    console.error('Ошибка обновления лимита:', error);
    res.status(500).json({ error: error.message || 'Ошибка обновления лимита' });
  }
});

// Установить лимит для исполнителя на услугу
router.post('/limits/set', async (req, res) => {
  try {
    const { executer_id, service_id, max_orders, notes } = req.body;

    if (!executer_id || !service_id || max_orders === undefined) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id, service_id и max_orders'
      });
    }

    const limit = await ExecuterLimitsService.setExecuterServiceLimit(
      parseInt(executer_id),
      parseInt(service_id),
      parseInt(max_orders),
      notes || ''
    );

    res.json(limit);
  } catch (error) {
    console.error('Ошибка установки лимита:', error);
    res.status(500).json({ error: error.message || 'Ошибка установки лимита' });
  }
});

// Проверить, может ли исполнитель взять заказ
router.get('/limits/check/:executerId/:serviceId', async (req, res) => {
  try {
    const { executerId, serviceId } = req.params;
    const result = await ExecuterLimitsService.canExecuterTakeOrder(
      parseInt(executerId),
      parseInt(serviceId)
    );
    res.json(result);
  } catch (error) {
    console.error('Ошибка проверки лимита:', error);
    res.status(500).json({ error: 'Ошибка проверки лимита исполнителя' });
  }
});

// Увеличить счетчик активных заказов
router.post('/limits/increment', async (req, res) => {
  try {
    const { executer_id, service_id } = req.body;

    if (!executer_id || !service_id) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id и service_id'
      });
    }

    const result = await ExecuterLimitsService.incrementActiveOrders(
      parseInt(executer_id),
      parseInt(service_id)
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка увеличения счетчика:', error);
    res.status(500).json({ error: error.message || 'Ошибка увеличения счетчика' });
  }
});

// Уменьшить счетчик активных заказов
router.post('/limits/decrement', async (req, res) => {
  try {
    const { executer_id, service_id } = req.body;

    if (!executer_id || !service_id) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id и service_id'
      });
    }

    const result = await ExecuterLimitsService.decrementActiveOrders(
      parseInt(executer_id),
      parseInt(service_id)
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка уменьшения счетчика:', error);
    res.status(500).json({ error: error.message || 'Ошибка уменьшения счетчика' });
  }
});

// Заблокировать исполнителя
router.post('/block/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;
    const { reason } = req.body;

    const result = await ExecuterLimitsService.blockExecuter(
      parseInt(executerId),
      reason || 'Заблокирован администратором'
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка блокировки исполнителя:', error);
    res.status(500).json({ error: error.message || 'Ошибка блокировки исполнителя' });
  }
});

// Разблокировать исполнителя
router.post('/unblock/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    const result = await ExecuterLimitsService.unblockExecuter(
      parseInt(executerId)
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка разблокировки исполнителя:', error);
    res.status(500).json({ error: error.message || 'Ошибка разблокировки исполнителя' });
  }
});

// Получить все запросы на увеличение лимита
router.get('/limit-requests', async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await ExecuterLimitsService.getAllLimitRequests(status || null);
    res.json(requests);
  } catch (error) {
    console.error('Ошибка получения запросов:', error);
    res.status(500).json({ error: 'Ошибка получения запросов на увеличение лимита' });
  }
});

// Создать запрос на увеличение лимита
router.post('/limit-requests', async (req, res) => {
  try {
    const { executer_id, service_id, requested_limit, reason } = req.body;

    if (!executer_id || !service_id || !requested_limit) {
      return res.status(400).json({
        error: 'Необходимо указать executer_id, service_id и requested_limit'
      });
    }

    const request = await ExecuterLimitsService.createLimitIncreaseRequest(
      parseInt(executer_id),
      parseInt(service_id),
      parseInt(requested_limit),
      reason || ''
    );

    res.json(request);
  } catch (error) {
    console.error('Ошибка создания запроса:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания запроса' });
  }
});

// Обработать запрос на увеличение лимита
router.post('/limit-requests/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, status, admin_response, new_limit } = req.body;

    if (!admin_id || !status) {
      return res.status(400).json({
        error: 'Необходимо указать admin_id и status'
      });
    }

    if (status === 'approved' && !new_limit) {
      return res.status(400).json({
        error: 'Для одобрения необходимо указать new_limit'
      });
    }

    const request = await ExecuterLimitsService.processLimitRequest(
      parseInt(id),
      parseInt(admin_id),
      status,
      admin_response || '',
      new_limit ? parseInt(new_limit) : null
    );

    res.json(request);
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    res.status(500).json({ error: error.message || 'Ошибка обработки запроса' });
  }
});

// Обновить запрос (альтернативный PUT маршрут для фронтенда)
router.put('/limit-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, newLimit } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать status'
      });
    }

    if (status === 'approved' && (newLimit === undefined || newLimit === '')) {
      return res.status(400).json({
        success: false,
        error: 'Для одобрения необходимо указать newLimit'
      });
    }

    const request = await ExecuterLimitsService.processLimitRequest(
      parseInt(id),
      1, // admin_id по умолчанию
      status,
      `Запрос ${status === 'approved' ? 'одобрен' : 'отклонен'} администратором`,
      status === 'approved' ? newLimit : null
    );

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Ошибка обработки запроса (PUT):', error);
    res.status(500).json({ success: false, error: 'Ошибка обработки запроса на увеличение лимита' });
  }
});

export default router;
