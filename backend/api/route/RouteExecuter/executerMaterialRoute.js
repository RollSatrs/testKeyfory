import express from 'express';
import { authExecuterMiddleware } from '../../middleware.js';
import {
  getMyMaterials,
  getMaterialsForOrder,
  useMaterial,
  getMaterialsStats
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
