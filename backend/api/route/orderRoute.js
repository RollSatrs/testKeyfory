import express from 'express';
import {
    getAllOrders,
    getOrderById,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderStats,
    getOrdersByExecuter,
    getOrdersByService
} from '../service/orderService.js';

export const orderRoute = express.Router();

// GET /orders/get - получить все заказы (альтернативный маршрут)
orderRoute.get('/get', async (req, res) => {
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /orders/getAll - получить все заказы
orderRoute.get('/getAll', async (req, res) => {
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /orders/stats - получить статистику заказов
orderRoute.get('/stats', async (req, res) => {
    try {
        const stats = await getOrderStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /orders/executer/:executerId - получить заказы по исполнителю
orderRoute.get('/executer/:executerId', async (req, res) => {
    try {
        const orders = await getOrdersByExecuter(req.params.executerId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders by executer:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /orders/service/:serviceId - получить заказы по услуге
orderRoute.get('/service/:serviceId', async (req, res) => {
    try {
        const orders = await getOrdersByService(req.params.serviceId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders by service:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /orders/get/:id - получить заказ по ID
orderRoute.get('/get/:id', async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(404).json({ error: error.message });
    }
});

// POST /orders/add - создать новый заказ
orderRoute.post('/add', async (req, res) => {
    try {
        const newOrder = await addOrder(req.body);
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /orders/update/:id - обновить заказ
orderRoute.put('/update/:id', async (req, res) => {
    try {
        const updatedOrder = await updateOrder(req.params.id, req.body);
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /orders/delete/:id - удалить заказ
orderRoute.delete('/delete/:id', async (req, res) => {
    try {
        const result = await deleteOrder(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(400).json({ error: error.message });
    }
});
