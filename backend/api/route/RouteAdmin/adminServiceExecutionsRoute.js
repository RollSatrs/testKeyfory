import { Router } from 'express';
import {
    getServiceExecutionEarningsSummary,
    getServiceExecutionEarningsChartData,
    getServiceExecutionExecuterStats
} from '../../service/ServiceAdmim/adminEarningsService.js';
import { authMiddleware } from '../../middleware.js';
import { ServiceExecution, Executer, Services } from '../../../database/dbTables.js';

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

// GET /api/admin/service-executions/order/:orderNumber/executers
// Возвращает список ServiceExecution для указанного order_number с информацией об исполнителе и услуге
router.get('/order/:orderNumber/executers', authMiddleware, async (req, res) => {
    try {
        const { orderNumber } = req.params;
        if (!orderNumber) return res.status(400).json({ error: 'orderNumber required' });

        const executions = await ServiceExecution.findAll({
            where: { order_number: orderNumber },
            include: [
                { model: Executer, as: 'Executer', attributes: ['id', 'name', 'telegram_id'] },
                { model: Services, as: 'Service', attributes: ['id', 'name', 'price'] }
            ],
            order: [['created_at', 'ASC']]
        });

        const result = executions.map(ex => ({
            id: ex.id,
            executer_id: ex.executer_id,
            executer_name: ex.Executer?.name,
            executer_telegram: ex.Executer?.telegram_id,
            service_id: ex.service_id,
            service_name: ex.Service?.name,
            status: ex.status,
            price: ex.price,
            started_at: ex.started_at,
            completed_at: ex.completed_at,
            created_at: ex.created_at,
            material_contents: ex.material_contents
        }));

        res.json({ orderNumber, executions: result });
    } catch (error) {
        console.error('Ошибка получения исполнителей по заказу:', error);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

export default router;
