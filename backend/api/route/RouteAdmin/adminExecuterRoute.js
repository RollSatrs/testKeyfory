import express from 'express';
import {
    getAllExecuters,
    getExecuterById,
    getExecuterByTelegramId,
    addExecuter,
    updateExecuter,
    deleteExecuter,
    getExecuterStats,
    getExecuterWithOrderStats,
    updateExecuterRating,
    getExecuterRights,
    updateExecuterRights,
    getAllLogs,
    getExecuterOrders
} from '../../service/ServiceAdmim/adminExecuterService.js';

export const executerRoute = express.Router();

// GET /executers/get - получить всех исполнителей
executerRoute.get('/get', async (req, res) => {
    try {
        const executers = await getAllExecuters();
        res.json(executers);
    } catch (error) {
        console.error('Error fetching executers:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /executer-rights/:executerId - получить права исполнителя
executerRoute.get('/executer-rights/:executerId', async (req, res) => {
    try {
        const { executerId } = req.params;
        const rights = await getExecuterRights(executerId);
        res.json(rights);
    } catch (error) {
        console.error('Error fetching executer rights:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /executer-rights/:executerId - обновить права исполнителя
executerRoute.put('/executer-rights/:executerId', async (req, res) => {
    try {
        const { executerId } = req.params;
        const { rights } = req.body;
        const result = await updateExecuterRights(executerId, rights);
        res.json(result);
    } catch (error) {
        console.error('Error updating executer rights:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /logs - получить все логи
executerRoute.get('/logs', async (req, res) => {
    try {
        const { limit = 100, offset = 0, user_type, action, executor_id } = req.query;
        const logs = await getAllLogs({ limit, offset, user_type, action, executor_id });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /executers/stats - получить статистику исполнителей
executerRoute.get('/stats', async (req, res) => {
    try {
        const stats = await getExecuterStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching executer stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /executers/telegram/:telegramId - получить исполнителя по Telegram ID
executerRoute.get('/telegram/:telegramId', async (req, res) => {
    try {
        const executer = await getExecuterByTelegramId(req.params.telegramId);
        if (!executer) {
            return res.status(404).json({ error: 'Executer not found' });
        }
        res.json(executer);
    } catch (error) {
        console.error('Error fetching executer by telegram ID:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /executers/get/:id - получить исполнителя по ID
executerRoute.get('/get/:id', async (req, res) => {
    try {
        const executer = await getExecuterById(req.params.id);
        res.json(executer);
    } catch (error) {
        console.error('Error fetching executer:', error);
        res.status(404).json({ error: error.message });
    }
});

// GET /executers/orders/:executerId - получить заказы исполнителя
executerRoute.get('/orders/:executerId', async (req, res) => {
    try {
        const { executerId } = req.params;
        const orders = await getExecuterOrders(executerId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching executer orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /executers/with-stats/:id - получить исполнителя со статистикой заказов
executerRoute.get('/with-stats/:id', async (req, res) => {
    try {
        const executer = await getExecuterWithOrderStats(req.params.id);
        res.json(executer);
    } catch (error) {
        console.error('Error fetching executer with stats:', error);
        res.status(404).json({ error: error.message });
    }
});

// POST /executers/add - создать нового исполнителя
executerRoute.post('/add', async (req, res) => {
    try {
        const newExecuter = await addExecuter(req.body);
        res.status(201).json(newExecuter);
    } catch (error) {
        console.error('Error creating executer:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /executers/update/:id - обновить исполнителя
executerRoute.put('/update/:id', async (req, res) => {
    try {
        const updatedExecuter = await updateExecuter(req.params.id, req.body);
        res.json(updatedExecuter);
    } catch (error) {
        console.error('Error updating executer:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /executers/:id/status - обновить статус исполнителя
executerRoute.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedExecuter = await updateExecuter(req.params.id, { status });
        res.json(updatedExecuter);
    } catch (error) {
        console.error('Error updating executer status:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /executers/rating/:id - обновить рейтинг исполнителя
executerRoute.put('/rating/:id', async (req, res) => {
    try {
        const { rating } = req.body;
        const updatedExecuter = await updateExecuterRating(req.params.id, rating);
        res.json(updatedExecuter);
    } catch (error) {
        console.error('Error updating executer rating:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /executers/delete/:id - удалить исполнителя
executerRoute.delete('/delete/:id', async (req, res) => {
    try {
        const result = await deleteExecuter(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting executer:', error);
        res.status(400).json({ error: error.message });
    }
});
