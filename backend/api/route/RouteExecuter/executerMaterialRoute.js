import express from 'express';
import { authExecuterMiddleware } from '../../middleware.js';
import {
  getMyMaterials,
  getMaterialsForOrder,
  useMaterial,
  getMaterialsStats,
  requestMaterialReplacement,
  markMaterialAsUsed
} from '../../service/ServiceExecuter/executerMaterialService.js';

export const executerMaterialRoute = express.Router();

// Получить материалы исполнителя (для его заказов)
executerMaterialRoute.get('/my', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const materials = await getMyMaterials(executerId);

    res.json({
      success: true,
      materials: materials
    });
  } catch (error) {
    console.error('Ошибка получения материалов исполнителя:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить доступные материалы для конкретного заказа
executerMaterialRoute.get('/order/:orderId', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const orderId = req.params.orderId;

    const materials = await getMaterialsForOrder(orderId, executerId);

    res.json({
      success: true,
      materials: materials
    });
  } catch (error) {
    console.error('Ошибка получения материалов для заказа:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Использовать материал для заказа
executerMaterialRoute.post('/:materialId/use', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const materialId = req.params.materialId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'ID заказа обязателен'
      });
    }

    const material = await useMaterial(materialId, orderId, executerId);

    res.json({
      success: true,
      message: 'Материал успешно использован',
      material: material
    });
  } catch (error) {
    console.error('Ошибка при использовании материала:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Получить статистику материалов для исполнителя
executerMaterialRoute.get('/stats', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const stats = await getMaterialsStats(executerId);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Ошибка получения статистики материалов:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить статистику материалов по услуге
executerMaterialRoute.get('/stats/:serviceId', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const serviceId = req.params.serviceId;

    const stats = await getServiceMaterialsStats(serviceId, executerId);

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики материалов:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить материал по номеру заказа
executerMaterialRoute.post('/get-by-order', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const { service_id, order_number } = req.body;

    if (!service_id || !order_number) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать service_id и order_number'
      });
    }

    const material = await getMaterialByOrder(service_id, order_number, executerId);

    res.json({
      success: true,
      material: material.contents,
      order_number: order_number
    });
  } catch (error) {
    console.error('Ошибка получения материала по заказу:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Запросить замену материала
executerMaterialRoute.post('/request-replacement/:materialId', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const materialId = req.params.materialId;
    const { reason } = req.body;

    const result = await requestMaterialReplacement(materialId, executerId, reason);

    res.json(result);
  } catch (error) {
    console.error('Ошибка запроса замены материала:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Пометить материал как использованный (резервация для исполнителя)
executerMaterialRoute.post('/:materialId/mark-used', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const materialId = req.params.materialId;
    const { orderNumber, reason } = req.body;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Номер заказа обязателен'
      });
    }

    const result = await markMaterialAsUsed(materialId, executerId, orderNumber, reason);

    res.json({
      success: true,
      message: 'Материал помечен как использованный',
      material: result
    });
  } catch (error) {
    console.error('Ошибка пометки материала как использованного:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
