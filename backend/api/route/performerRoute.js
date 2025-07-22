import express from 'express';
import {
    getAllPerformers,
    getPerformerById,
    getPerformerByTelegramId,
    addPerformer,
    updatePerformer,
    deletePerformer,
    getPerformerStats,
    getPerformerWithOrderStats,
    updatePerformerRating
} from '../service/performerService.js';

export const performerRoute = express.Router();

// GET /performers/get - получить всех исполнителей
performerRoute.get('/get', async (req, res) => {
    try {
        const performers = await getAllPerformers();
        res.json(performers);
    } catch (error) {
        console.error('Error fetching performers:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /performers/stats - получить статистику исполнителей
performerRoute.get('/stats', async (req, res) => {
    try {
        const stats = await getPerformerStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching performer stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /performers/telegram/:telegramId - получить исполнителя по Telegram ID
performerRoute.get('/telegram/:telegramId', async (req, res) => {
    try {
        const performer = await getPerformerByTelegramId(req.params.telegramId);
        if (!performer) {
            return res.status(404).json({ error: 'Performer not found' });
        }
        res.json(performer);
    } catch (error) {
        console.error('Error fetching performer by telegram ID:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /performers/get/:id - получить исполнителя по ID
performerRoute.get('/get/:id', async (req, res) => {
    try {
        const performer = await getPerformerById(req.params.id);
        res.json(performer);
    } catch (error) {
        console.error('Error fetching performer:', error);
        res.status(404).json({ error: error.message });
    }
});

// GET /performers/with-stats/:id - получить исполнителя со статистикой заказов
performerRoute.get('/with-stats/:id', async (req, res) => {
    try {
        const performer = await getPerformerWithOrderStats(req.params.id);
        res.json(performer);
    } catch (error) {
        console.error('Error fetching performer with stats:', error);
        res.status(404).json({ error: error.message });
    }
});

// POST /performers/add - создать нового исполнителя
performerRoute.post('/add', async (req, res) => {
    try {
        const newPerformer = await addPerformer(req.body);
        res.status(201).json(newPerformer);
    } catch (error) {
        console.error('Error creating performer:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /performers/update/:id - обновить исполнителя
performerRoute.put('/update/:id', async (req, res) => {
    try {
        const updatedPerformer = await updatePerformer(req.params.id, req.body);
        res.json(updatedPerformer);
    } catch (error) {
        console.error('Error updating performer:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /performers/rating/:id - обновить рейтинг исполнителя
performerRoute.put('/rating/:id', async (req, res) => {
    try {
        const { rating } = req.body;
        const updatedPerformer = await updatePerformerRating(req.params.id, rating);
        res.json(updatedPerformer);
    } catch (error) {
        console.error('Error updating performer rating:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /performers/delete/:id - удалить исполнителя
performerRoute.delete('/delete/:id', async (req, res) => {
    try {
        const result = await deletePerformer(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting performer:', error);
        res.status(400).json({ error: error.message });
    }
});
