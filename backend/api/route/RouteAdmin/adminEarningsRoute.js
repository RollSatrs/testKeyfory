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

// Получить статистику заработка по исполнителям (для PricingTable)
router.get('/executers', async (req, res) => {
    try {
        const executerEarnings = await adminEarningsService.getExecuterEarningsForPricing();
        res.json(executerEarnings);
    } catch (error) {
        console.error('Ошибка получения статистики исполнителей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить статистику заработка по исполнителям (новый эндпоинт для ExecuterStatsTable)
router.get('/by-executer', async (req, res) => {
    try {
        const { start_date, end_date, executer_id } = req.query;

        // Импортируем модели прямо здесь
        const { Executer, ServiceExecution, Services } = await import('../../../database/dbTables.js');
        const { Op } = await import('sequelize');

        // Получаем всех исполнителей
        const executers = await Executer.findAll({
            attributes: ['id', 'name', 'telegram_id', 'status']
        });

        // Для каждого исполнителя получаем статистику
        const executersWithStats = await Promise.all(executers.map(async (executer) => {
            try {
                // Фильтры для ServiceExecution
                const whereConditions = {
                    executer_id: executer.id,
                    status: 'completed'
                };

                if (start_date) {
                    whereConditions.completed_at = {
                        ...whereConditions.completed_at,
                        [Op.gte]: start_date
                    };
                }

                if (end_date) {
                    whereConditions.completed_at = {
                        ...whereConditions.completed_at,
                        [Op.lte]: end_date + ' 23:59:59'
                    };
                }

                // Если фильтр по конкретному исполнителю и это не он - пропускаем
                if (executer_id && executer.id.toString() !== executer_id.toString()) {
                    return null;
                }

                // Получаем выполненные заказы
                const executions = await ServiceExecution.findAll({
                    where: whereConditions,
                    include: [{
                        model: Services,
                        as: 'Service',
                        attributes: ['name'],
                        required: false
                    }]
                });

                // Вычисляем статистику
                const totalAmount = executions.reduce((sum, exec) => sum + (exec.price || 0), 0);
                const orderCount = executions.length;
                const avgAmount = orderCount > 0 ? totalAmount / orderCount : 0;

                // Получаем уникальные услуги
                const services = [...new Set(
                    executions
                        .map(exec => exec.Service?.name)
                        .filter(Boolean)
                )];

                return {
                    executer_id: executer.id,
                    executer_name: executer.name,
                    telegram_id: executer.telegram_id,
                    total_amount: totalAmount,
                    order_count: orderCount,
                    avg_amount: Math.round(avgAmount),
                    services: services
                };
            } catch (error) {
                console.error(`Ошибка обработки исполнителя ${executer.id}:`, error);
                return {
                    executer_id: executer.id,
                    executer_name: executer.name,
                    telegram_id: executer.telegram_id,
                    total_amount: 0,
                    order_count: 0,
                    avg_amount: 0,
                    services: []
                };
            }
        }));

        // Фильтруем null значения и сортируем по заработку
        const result = executersWithStats
            .filter(Boolean)
            .sort((a, b) => b.total_amount - a.total_amount);

        res.json(result);
    } catch (error) {
        console.error('Ошибка получения статистики по исполнителям:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить статистику времени выполнения по исполнителям
router.get('/execution-time', async (req, res) => {
    try {
        const { ServiceExecution } = await import('../../../database/dbTables.js');
        const { Op } = await import('sequelize');

        // Получаем завершенные заказы с временными метками
        const executions = await ServiceExecution.findAll({
            where: {
                status: 'completed',
                created_at: { [Op.ne]: null },
                completed_at: { [Op.ne]: null }
            },
            attributes: ['executer_id', 'created_at', 'completed_at'],
            raw: true
        });

        // Группируем по исполнителям и считаем статистику
        const timeStats = {};

        executions.forEach(execution => {
            const createdAt = new Date(execution.created_at);
            const completedAt = new Date(execution.completed_at);
            const diffMinutes = Math.round((completedAt - createdAt) / (1000 * 60));

            // Пропускаем некорректные данные
            if (diffMinutes <= 0 || diffMinutes > 10080) { // больше недели - явно ошибка
                return;
            }

            if (!timeStats[execution.executer_id]) {
                timeStats[execution.executer_id] = {
                    times: [],
                    total_completed: 0
                };
            }

            timeStats[execution.executer_id].times.push(diffMinutes);
            timeStats[execution.executer_id].total_completed++;
        });

        // Вычисляем статистику для каждого исполнителя
        const result = {};
        Object.keys(timeStats).forEach(executerId => {
            const times = timeStats[executerId].times;
            if (times.length > 0) {
                result[executerId] = {
                    avg_time_minutes: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
                    fastest_time_minutes: Math.min(...times),
                    slowest_time_minutes: Math.max(...times),
                    total_completed: times.length
                };
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Ошибка получения статистики времени:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить статистику заработка по услугам (для PricingTable)
router.get('/services', async (req, res) => {
    try {
        const serviceStats = await adminEarningsService.getServiceEarningsForPricing();
        res.json(serviceStats);
    } catch (error) {
        console.error('Ошибка получения статистики услуг:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Специальный эндпоинт для полной очистки статистических данных
router.delete('/clear-all-data', async (req, res) => {
    try {
        const { ServiceExecution, ExecuterPricing, ExecuterEarnings } = await import('../../../database/dbTables.js');

        // Очищаем все связанные таблицы
        const serviceExecutionResult = await ServiceExecution.destroy({
            where: {},
            force: true
        });

        const pricingResult = await ExecuterPricing.destroy({
            where: {},
            force: true
        });

        // Очищаем таблицу ExecuterEarnings
        const earningsResult = await ExecuterEarnings.destroy({
            where: {},
            force: true
        });

        console.log(`Очищено ServiceExecution записей: ${serviceExecutionResult}`);
        console.log(`Очищено ExecuterPricing записей: ${pricingResult}`);
        console.log(`Очищено ExecuterEarnings записей: ${earningsResult}`);

        res.json({
            success: true,
            message: 'Все статистические данные успешно очищены',
            deletedServiceExecutions: serviceExecutionResult,
            deletedPricing: pricingResult,
            deletedEarnings: earningsResult
        });
    } catch (error) {
        console.error('Ошибка очистки всех данных:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router;
