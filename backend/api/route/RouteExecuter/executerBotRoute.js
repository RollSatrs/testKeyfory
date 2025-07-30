import express from 'express';
import ExecuterBotService from '../../service/ServiceExecuter/executerBotService.js';

const router = express.Router();

// Получить доступные услуги для исполнителя
router.get('/services/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Получаем исполнителя
    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Получаем доступные услуги
    const services = await ExecuterBotService.getAvailableServices(executer.id);

    res.json({
      success: true,
      services: services
    });
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Привязать номер заказа и получить материал
router.post('/assign-order', async (req, res) => {
  try {
    const { telegramId, serviceId, orderNumber } = req.body;

    if (!telegramId || !serviceId || !orderNumber) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    // Получаем исполнителя
    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Привязываем заказ и получаем материал
    const material = await ExecuterBotService.assignOrderAndGetMaterial(
      executer.id,
      serviceId,
      orderNumber
    );

    res.json({
      success: true,
      material: {
        id: material.id,
        contents: material.contents,
        type_key: material.type_key,
        order_number: material.order_number
      }
    });
  } catch (error) {
    console.error('Ошибка привязки заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

// Использовать материал
router.post('/use-material', async (req, res) => {
  try {
    const { telegramId, materialId } = req.body;

    if (!telegramId || !materialId) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    // Получаем исполнителя
    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Используем материал
    const material = await ExecuterBotService.useMaterial(materialId, executer.id);

    res.json({
      success: true,
      message: 'Материал успешно использован',
      material: {
        id: material.id,
        contents: material.contents,
        used_date: material.used_date,
        status: material.status
      }
    });
  } catch (error) {
    console.error('Ошибка использования материала:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запросить замену материала
router.post('/request-replacement', async (req, res) => {
  try {
    const { telegramId, materialId } = req.body;

    if (!telegramId || !materialId) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    // Получаем исполнителя
    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Запрашиваем замену
    const material = await ExecuterBotService.requestMaterialReplacement(materialId, executer.id);

    res.json({
      success: true,
      message: 'Запрос на замену отправлен',
      material: {
        id: material.id,
        status: material.status,
        replacement_requested_date: material.replacement_requested_date
      }
    });
  } catch (error) {
    console.error('Ошибка запроса замены:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить историю материалов
router.get('/history/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Получаем исполнителя
    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Получаем историю
    const history = await ExecuterBotService.getExecuterMaterialHistory(executer.id);

    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создать заказ с номером
router.post('/create-order', async (req, res) => {
  try {
    const { telegramId, serviceId, orderNumber } = req.body;

    if (!telegramId || !serviceId || !orderNumber) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const result = await ExecuterBotService.createOrder(executer.id, serviceId, orderNumber);

    res.json({
      success: true,
      order: result.order,
      service: result.service,
      materials: result.materials,
      customPrice: result.customPrice
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отметить материал как используемый
router.post('/use-material', async (req, res) => {
  try {
    const { telegramId, materialId, orderId } = req.body;

    if (!telegramId || !materialId || !orderId) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const result = await ExecuterBotService.useMaterialForOrder(executer.id, materialId, orderId);

    res.json({
      success: true,
      material: result
    });
  } catch (error) {
    console.error('Ошибка использования материала:', error);
    res.status(500).json({ error: error.message });
  }
});

// Завершить заказ
router.post('/complete-order', async (req, res) => {
  try {
    const { telegramId, orderId } = req.body;

    if (!telegramId || !orderId) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    const executer = await ExecuterBotService.getExecuterByTelegramId(telegramId);
    if (!executer) {
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    const result = await ExecuterBotService.completeOrder(executer.id, orderId);

    res.json({
      success: true,
      order: result
    });
  } catch (error) {
    console.error('Ошибка завершения заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
