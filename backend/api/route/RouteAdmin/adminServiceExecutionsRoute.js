import { Router } from 'express';
import {
    getServiceExecutionEarningsSummary,
    getServiceExecutionEarningsChartData,
    getServiceExecutionExecuterStats
} from '../../service/ServiceAdmim/adminEarningsService.js';
import { authMiddleware } from '../../middleware.js';

const router = Router();

// Получить общую статистику заработка
router.get('/earnings-summary', authMiddleware, async (req, res) => {
    try {
        const summary = await getServiceExecutionEarningsSummary();
        res.json(summary);
    } catch (error) {
        console.error('Ошибка получения статистики заработка:', error);
        res.status(500).json({
            error: 'Ошибка получения статистики заработка',
            details: error.message
        });
    }
});

// Получить данные для графика заработка
router.get('/earnings-chart', authMiddleware, async (req, res) => {
    try {
        const { from, to } = req.query;
        const chartData = await getServiceExecutionEarningsChartData(from, to);
        res.json(chartData);
    } catch (error) {
        console.error('Ошибка получения данных графика:', error);
        res.status(500).json({
            error: 'Ошибка получения данных графика',
            details: error.message
        });
    }
});

// Получить статистику по исполнителям
router.get('/executer-stats', authMiddleware, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const stats = await getServiceExecutionExecuterStats(period);
        res.json(stats);
    } catch (error) {
        console.error('Ошибка получения статистики исполнителей:', error);
        res.status(500).json({
            error: 'Ошибка получения статистики исполнителей',
            details: error.message
        });
    }
});

export default router;
