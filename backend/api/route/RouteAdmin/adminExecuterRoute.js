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
    updateExecuterRating
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
