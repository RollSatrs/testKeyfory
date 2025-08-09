import express from 'express';
import adminEarningsService, {
    getServiceExecutionEarningsSummary,
    getServiceExecutionEarningsChartData,
    getServiceExecutionExecuterStats,
    getServicesPerformanceStats,
    getComparativeAnalytics
} from '../../service/ServiceAdmim/adminEarningsService.js';

const router = express.Router();

// Получить всю статистику заработка
router.get('/all', async (req, res) => {
    try {
        const { from, to, executer_id, service_id } = req.query;

        const earnings = await adminEarningsService.getAllEarnings({
            from,
            to,
            executer_id,
            service_id
        });

        res.json(earnings);
    } catch (error) {
        console.error('Ошибка получения статистики заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить заработок конкретного исполнителя
router.get('/executer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        const earnings = await adminEarningsService.getExecuterEarnings(id, { from, to });
        res.json(earnings);
    } catch (error) {
        console.error('Ошибка получения заработка исполнителя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создать запись о заработке
router.post('/add', async (req, res) => {
    try {
        const { executer_id, service_id, order_id, amount, base_price, custom_price } = req.body;

        const earning = await adminEarningsService.addEarning({
            executer_id,
            service_id,
            order_id,
            amount,
            base_price,
            custom_price
        });

        res.json(earning);
    } catch (error) {
        console.error('Ошибка добавления заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить статус выплаты
router.put('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const earning = await adminEarningsService.updateEarningStatus(id, status);
        res.json(earning);
    } catch (error) {
        console.error('Ошибка обновления статуса заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить сводную статистику
router.get('/summary', async (req, res) => {
    try {
        const { from, to } = req.query;

        const summary = await adminEarningsService.getEarningsSummary({ from, to });
        res.json(summary);
    } catch (error) {
        console.error('Ошибка получения сводной статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== НОВЫЕ ENDPOINTS ДЛЯ АНАЛИТИКИ ====================

// Получить статистику заработка из ServiceExecution
router.get('/service-executions/summary', async (req, res) => {
    try {
        const summary = await getServiceExecutionEarningsSummary();
        res.json(summary);
    } catch (error) {
        console.error('Ошибка получения статистики ServiceExecution:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить данные для графика заработка
router.get('/service-executions/chart', async (req, res) => {
    try {
        const { from, to } = req.query;
        const chartData = await getServiceExecutionEarningsChartData(from, to);
        res.json(chartData);
    } catch (error) {
        console.error('Ошибка получения данных графика:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику по исполнителям
router.get('/service-executions/executer-stats', async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await getServiceExecutionExecuterStats(period);
        res.json(stats);
    } catch (error) {
        console.error('Ошибка получения статистики исполнителей:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику по услугам (что лучше продается)
router.get('/services/performance', async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await getServicesPerformanceStats(period);
        res.json(stats);
    } catch (error) {
        console.error('Ошибка получения статистики услуг:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить сравнительную аналитику за два периода
router.get('/comparative', async (req, res) => {
    try {
        const { currentPeriod, previousPeriod } = req.query;
        const analytics = await getComparativeAnalytics(currentPeriod, previousPeriod);
        res.json(analytics);
    } catch (error) {
        console.error('Ошибка получения сравнительной аналитики:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить полную аналитику (сводка всех данных)
router.get('/full-analytics', async (req, res) => {
    try {
        const { period, from, to } = req.query;

        // Получаем все виды статистики
        const [
            summary,
            chartData,
            executerStats,
            servicesStats,
            comparative
        ] = await Promise.all([
            getServiceExecutionEarningsSummary(),
            getServiceExecutionEarningsChartData(from, to),
            getServiceExecutionExecuterStats(period || 'month'),
            getServicesPerformanceStats(period || 'month'),
            getComparativeAnalytics(period || 'month', period || 'month')
        ]);

        res.json({
            summary,
            chartData: chartData.chartData,
            executerStats: executerStats.executerStats,
            topExecuters: executerStats.topExecuters,
            servicesAnalytics: servicesStats,
            comparative
        });
    } catch (error) {
        console.error('Ошибка получения полной аналитики:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить простую статистику по исполнителям для frontend
router.get('/simple-executer-stats', async (req, res) => {
    try {
        const { Executer, ServiceExecution, Services } = await import('../../../database/dbTables.js');

        // Получаем всех исполнителей с их статистикой
        const executers = await Executer.findAll({
            attributes: ['id', 'name', 'telegram_id', 'rating', 'status'],
            include: [{
                model: ServiceExecution,
                as: 'ExecuterExecutions',
                where: { status: 'completed' },
                required: false,
                include: [{
                    model: Services,
                    as: 'Service',
                    attributes: ['name', 'price']
                }]
            }]
        });

        // Обрабатываем данные для frontend
        const executerStats = executers.map(executer => {
            const completedExecutions = executer.ExecuterExecutions || [];
            const totalEarnings = completedExecutions.reduce((sum, execution) => {
                return sum + (execution.price || execution.Service?.price || 0);
            }, 0);

            return {
                id: executer.id,
                name: executer.name,
                telegram_id: executer.telegram_id,
                rating: executer.rating || 0,
                status: executer.status,
                earnings: totalEarnings,
                orders: completedExecutions.length,
                completionRate: completedExecutions.length > 0 ? 95 : 0 // Примерный процент выполнения
            };
        });

        res.json(executerStats);
    } catch (error) {
        console.error('Ошибка получения статистики исполнителей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить общую статистику для dashboard
router.get('/dashboard-summary', async (req, res) => {
    try {
        const { Executer, ServiceExecution, Services } = await import('../../../database/dbTables.js');
        const { Op } = await import('sequelize');

        // Общий заработок
        const totalEarningsResult = await ServiceExecution.sum('price', {
            where: { status: 'completed' }
        });

        // Заработок за текущий месяц
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const monthlyEarningsResult = await ServiceExecution.sum('price', {
            where: {
                status: 'completed',
                completed_at: {
                    [Op.gte]: currentMonth
                }
            }
        });

        // Количество активных исполнителей
        const activeExecuters = await Executer.count({
            where: { status: 'active' }
        });

        // Общее количество выполненных заказов
        const completedOrders = await ServiceExecution.count({
            where: { status: 'completed' }
        });

        console.log('Dashboard summary:', {
            totalEarnings: totalEarningsResult || 0,
            monthlyEarnings: monthlyEarningsResult || 0,
            activeExecuters: activeExecuters || 0,
            completedOrders: completedOrders || 0
        });

        res.json({
            totalEarnings: totalEarningsResult || 0,
            monthlyEarnings: monthlyEarningsResult || 0,
            activeExecuters: activeExecuters || 0,
            completedOrders: completedOrders || 0
        });
    } catch (error) {
        console.error('Ошибка получения общей статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router;
