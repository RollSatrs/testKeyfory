import express from 'express';
import { authExecuterMiddleware } from '../../middleware.js';
import {
  getMyOrders,
  getAvailableOrders,
  takeOrder,
  updateOrderStatus,
  cancelOrder
} from '../../service/ServiceExecuter/executerOrderService.js';

export const executerOrderRoute = express.Router();

// Получить все заказы текущего исполнителя
executerOrderRoute.get('/my', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const orders = await getMyOrders(executerId);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Ошибка получения заказов исполнителя:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить доступные заказы (без исполнителя)
executerOrderRoute.get('/available', authExecuterMiddleware, async (req, res) => {
  try {
    const orders = await getAvailableOrders();

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Ошибка получения доступных заказов:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Взять заказ в работу
executerOrderRoute.post('/:orderId/take', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const orderId = req.params.orderId;

    const order = await takeOrder(orderId, executerId);

    res.json({
      success: true,
      message: 'Заказ успешно взят в работу',
      order: order
    });
  } catch (error) {
    console.error('Ошибка при взятии заказа:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить статус заказа
executerOrderRoute.put('/:orderId/status', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const orderId = req.params.orderId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус заказа обязателен'
      });
    }

    const order = await updateOrderStatus(orderId, executerId, status);

    res.json({
      success: true,
      message: 'Статус заказа успешно обновлен',
      order: order
    });
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Отменить заказ (вернуть в доступные)
executerOrderRoute.delete('/:orderId/cancel', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const orderId = req.params.orderId;

    const result = await cancelOrder(orderId, executerId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Ошибка при отмене заказа:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
