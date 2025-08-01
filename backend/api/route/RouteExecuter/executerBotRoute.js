import express from 'express';
import { Op } from 'sequelize';
import { Services, Material, ServiceAccess, Executer, ServiceExecution, MaterialReplacement } from '../../../database/dbTables.js';

const router = express.Router();

// GET /api/executers/services/:executerId - Получить услуги исполнителя
router.get('/services/:executerId', async (req, res) => {
  try {
    const { executerId } = req.params;

    console.log(`\n🎯 === API: ПОЛУЧЕНИЕ УСЛУГ ИСПОЛНИТЕЛЯ ===`);
    console.log(`👤 Executer ID: ${executerId}`);

    // Получаем услуги двумя способами:
    // 1. Через ServiceAccess (доступ к услугам)
    const serviceAccess = await ServiceAccess.findAll({
      where: { executer_id: executerId },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name', 'price', 'category', 'description']
      }]
    });

    // 2. Через прямое назначение в Services (executer_id)
    const assignedServices = await Services.findAll({
      where: { executer_id: executerId },
      attributes: ['id', 'name', 'price', 'category', 'description']
    });

    // Объединяем результаты и убираем дубликаты
    const accessServices = serviceAccess.map(access => access.Service).filter(Boolean);
    const allServices = [...accessServices, ...assignedServices];

    // Убираем дубликаты по ID
    const uniqueServices = allServices.filter((service, index, self) =>
      index === self.findIndex(s => s.id === service.id)
    );

    console.log(`📋 Найдено услуг через ServiceAccess: ${accessServices.length}`);
    console.log(`📋 Найдено услуг через прямое назначение: ${assignedServices.length}`);
    console.log(`📋 Итого уникальных услуг: ${uniqueServices.length}`);

    res.json(uniqueServices);
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

    // Получаем доступные материалы для услуги
    const materials = await Material.findAll({
      where: {
        service_id: serviceId,
        status: 'available'
      },
      attributes: ['id', 'contents', 'status', 'type_key'],
      order: [['created_at', 'DESC']]
    });

    console.log(`📦 Найдено доступных материалов: ${materials.length}`);

    res.json(materials);
  } catch (error) {
    console.error('❌ Ошибка при получении материалов услуги:', error);
    res.status(500).json({
      message: 'Ошибка при получении материалов услуги',
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

    if (material.status !== 'available') {
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

    // Обновляем статус материала на 'used'
    await material.update({ status: 'used' });

    // Создаем запись MaterialReplacement для связи
    await MaterialReplacement.create({
      material_id,
      service_execution_id: serviceExecution.id,
      executer_id,
      reason: 'Использование материала в заказе',
      status: 'completed',
      replaced_at: new Date()
    });

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
          [Op.ne]: 'completed'
        }
      },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name', 'price', 'category']
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Найдено активных заказов: ${executions.length}`);

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
        attributes: ['id', 'name', 'price', 'category']
      }]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    console.log(`📋 Заказ найден: ${execution.order_number}`);

    res.json(execution);
  } catch (error) {
    console.error('❌ Ошибка при получении деталей заказа:', error);
    res.status(500).json({
      message: 'Ошибка при получении деталей заказа',
      error: error.message
    });
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

    // Обновляем статус на завершенный
    await execution.update({
      status: 'completed',
      completed_at: new Date()
    });

    console.log(`✅ Заказ ${execution.order_number} завершен`);

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

export default router;
