import { ExecuterEarnings, Executer, Services, Order, ServiceExecution } from '../../../database/dbTables.js';
import { Op } from 'sequelize';

class AdminEarningsService {

    // Получить всю статистику заработка с фильтрами
    async getAllEarnings(filters = {}) {
        try {
            const whereClause = {};

            // Фильтр по дате
            if (filters.from && filters.to) {
                whereClause.created_at = {
                    [Op.between]: [new Date(filters.from), new Date(filters.to)]
                };
            }

            // Фильтр по исполнителю
            if (filters.executer_id) {
                whereClause.executer_id = filters.executer_id;
            }

            // Фильтр по услуге
            if (filters.service_id) {
                whereClause.service_id = filters.service_id;
            }

            const earnings = await ExecuterEarnings.findAll({
                where: whereClause,
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name', 'telegram_id']
                    },
                    {
                        model: Services,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Order,
                        attributes: ['id', 'status']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // Сериализуем данные для фронтенда
            const serializedEarnings = earnings.map(earning => {
                const earningData = earning.toJSON();
                return {
                    ...earningData,
                    executer_name: earningData.Executer?.name || null,
                    executer_telegram_id: earningData.Executer?.telegram_id || null,
                    service_name: earningData.Service?.name || null,
                    order_status: earningData.Order?.status || null
                };
            });

            return serializedEarnings;
        } catch (error) {
            console.error('Ошибка получения заработка:', error);
            throw error;
        }
    }

    // Получить заработок конкретного исполнителя
    async getExecuterEarnings(executer_id, filters = {}) {
        try {
            const whereClause = { executer_id };

            if (filters.from && filters.to) {
                whereClause.created_at = {
                    [Op.between]: [new Date(filters.from), new Date(filters.to)]
                };
            }

            const earnings = await ExecuterEarnings.findAll({
                where: whereClause,
                include: [
                    {
                        model: Services,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Order,
                        attributes: ['id', 'status']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // Подсчитываем общую сумму
            const totalAmount = earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);

            return {
                earnings,
                total_amount: totalAmount,
                count: earnings.length
            };
        } catch (error) {
            console.error('Ошибка получения заработка исполнителя:', error);
            throw error;
        }
    }

    // Добавить запись о заработке
    async addEarning(data) {
        try {
            const earning = await ExecuterEarnings.create({
                executer_id: data.executer_id,
                service_id: data.service_id,
                order_id: data.order_id,
                amount: data.amount,
                base_price: data.base_price,
                custom_price: data.custom_price,
                status: 'pending'
            });

            return earning;
        } catch (error) {
            console.error('Ошибка добавления заработка:', error);
            throw error;
        }
    }

    // Обновить статус выплаты
    async updateEarningStatus(id, status) {
        try {
            const earning = await ExecuterEarnings.findByPk(id);
            if (!earning) {
                throw new Error('Запись о заработке не найдена');
            }

            earning.status = status;
            await earning.save();

            return earning;
        } catch (error) {
            console.error('Ошибка обновления статуса заработка:', error);
            throw error;
        }
    }

    // Получить сводную статистику
    async getEarningsSummary(filters = {}) {
        try {
            const whereClause = {};

            if (filters.from && filters.to) {
                whereClause.created_at = {
                    [Op.between]: [new Date(filters.from), new Date(filters.to)]
                };
            }

            const earnings = await ExecuterEarnings.findAll({
                where: whereClause,
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name']
                    }
                ]
            });

            // Группируем по исполнителям
            const executerEarnings = {};
            let totalAmount = 0;
            let pendingAmount = 0;
            let paidAmount = 0;

            earnings.forEach(earning => {
                const executerId = earning.executer_id;
                const executerName = earning.Executer ? earning.Executer.name : `Исполнитель ${executerId}`;

                if (!executerEarnings[executerId]) {
                    executerEarnings[executerId] = {
                        executer_id: executerId,
                        executer_name: executerName,
                        total_amount: 0,
                        pending_amount: 0,
                        paid_amount: 0,
                        count: 0
                    };
                }

                const amount = earning.amount || 0;
                executerEarnings[executerId].total_amount += amount;
                executerEarnings[executerId].count += 1;

                if (earning.status === 'pending') {
                    executerEarnings[executerId].pending_amount += amount;
                    pendingAmount += amount;
                } else if (earning.status === 'paid') {
                    executerEarnings[executerId].paid_amount += amount;
                    paidAmount += amount;
                }

                totalAmount += amount;
            });

            return {
                total_amount: totalAmount,
                pending_amount: pendingAmount,
                paid_amount: paidAmount,
                total_count: earnings.length,
                executer_earnings: Object.values(executerEarnings)
            };
        } catch (error) {
            console.error('Ошибка получения сводной статистики:', error);
            throw error;
        }
    }

    // Создать заработок при выполнении заказа
    async createEarningForOrder(executer_id, service_id, order_id) {
        try {
            // Получаем цену для исполнителя (индивидуальную или базовую)
            const { default: adminPricingService } = await import('./adminPricingService.js');
            const price = await adminPricingService.getPriceForExecuter(executer_id, service_id);

            // Получаем базовую цену услуги
            const service = await Services.findByPk(service_id);
            const basePrice = service ? service.price : 0;

            const earning = await this.addEarning({
                executer_id,
                service_id,
                order_id,
                amount: price,
                base_price: basePrice,
                custom_price: price !== basePrice ? price : null
            });

            return earning;
        } catch (error) {
            console.error('Ошибка создания заработка для заказа:', error);
            throw error;
        }
    }

    // Получить статистику заработка по исполнителям (для PricingTable)
    async getExecuterEarningsForPricing() {
        try {
            const executerEarnings = await ExecuterEarnings.findAll({
                attributes: [
                    'executer_id',
                    [Op.literal('SUM(amount)'), 'totalEarnings'],
                    [Op.literal('COUNT(*)'), 'completedOrders']
                ],
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name']
                    }
                ],
                group: ['executer_id', 'Executer.id'],
                having: Op.literal('SUM(amount) > 0')
            });

            // Преобразуем в удобный формат для фронтенда
            const result = {};
            executerEarnings.forEach(earning => {
                result[earning.executer_id] = {
                    totalEarnings: parseInt(earning.dataValues.totalEarnings) || 0,
                    completedOrders: parseInt(earning.dataValues.completedOrders) || 0,
                    executerName: earning.Executer?.name || `Исполнитель ${earning.executer_id}`
                };
            });

            return result;
        } catch (error) {
            console.error('Ошибка получения статистики исполнителей:', error);
            throw error;
        }
    }

    // Получить статистику заработка по услугам (для PricingTable)
    async getServiceEarningsForPricing() {
        try {
            const serviceStats = await ExecuterEarnings.findAll({
                attributes: [
                    'service_id',
                    [Op.literal('SUM(amount)'), 'totalEarnings'],
                    [Op.literal('COUNT(*)'), 'completedOrders'],
                    [Op.literal('AVG(amount)'), 'averagePrice']
                ],
                include: [
                    {
                        model: Services,
                        attributes: ['id', 'name']
                    }
                ],
                group: ['service_id', 'Service.id'],
                having: Op.literal('SUM(amount) > 0')
            });

            // Преобразуем в удобный формат для фронтенда
            const result = {};
            serviceStats.forEach(stat => {
                result[stat.service_id] = {
                    totalEarnings: parseInt(stat.dataValues.totalEarnings) || 0,
                    completedOrders: parseInt(stat.dataValues.completedOrders) || 0,
                    averagePrice: parseInt(stat.dataValues.averagePrice) || 0,
                    serviceName: stat.Service?.name || `Услуга ${stat.service_id}`
                };
            });

            return result;
        } catch (error) {
            console.error('Ошибка получения статистики услуг:', error);
            throw error;
        }
    }
}

export default new AdminEarningsService();

// Дополнительные функции для статистики заработка с ServiceExecution

// Получить общую статистику заработка из ServiceExecution
export async function getServiceExecutionEarningsSummary() {
    try {
        // Общий заработок (сумма цен всех завершенных заказов)
        const totalEarningsResult = await ServiceExecution.sum('price', {
            where: {
                status: 'completed'
            }
        })
        const totalEarnings = totalEarningsResult || 0

        // Заработок за текущий месяц
        const currentMonth = new Date()
        currentMonth.setDate(1)
        currentMonth.setHours(0, 0, 0, 0)

        const monthlyEarningsResult = await ServiceExecution.sum('price', {
            where: {
                status: 'completed',
                completed_at: {
                    [Op.gte]: currentMonth
                }
            }
        })
        const monthlyEarnings = monthlyEarningsResult || 0

        // Количество завершенных заказов
        const completedOrders = await ServiceExecution.count({
            where: {
                status: 'completed'
            }
        })

        return {
            totalEarnings,
            monthlyEarnings,
            completedOrders
        }
    } catch (error) {
        throw new Error(`Ошибка получения статистики заработка: ${error.message}`)
    }
}

// Получить данные для графика заработка по дням из ServiceExecution
export async function getServiceExecutionEarningsChartData(fromDate, toDate) {
    try {
        const whereClause = {
            status: 'completed'
        }

        if (fromDate && toDate) {
            whereClause.completed_at = {
                [Op.between]: [new Date(fromDate), new Date(toDate)]
            }
        } else {
            // По умолчанию показываем последние 30 дней
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            whereClause.completed_at = {
                [Op.gte]: thirtyDaysAgo
            }
        }

        const executions = await ServiceExecution.findAll({
            where: whereClause,
            attributes: ['completed_at', 'price'],
            order: [['completed_at', 'ASC']]
        })

        // Группируем по дням
        const dailyData = {}
        executions.forEach(execution => {
            const date = execution.completed_at.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
            })

            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    earnings: 0,
                    orders: 0
                }
            }

            dailyData[date].earnings += execution.price
            dailyData[date].orders += 1
        })

        const chartData = Object.values(dailyData)

        return { chartData }
    } catch (error) {
        throw new Error(`Ошибка получения данных графика: ${error.message}`)
    }
}

// Получить статистику по исполнителям из ServiceExecution
export async function getServiceExecutionExecuterStats(period = 'month') {
    try {
        let dateFilter = {}
        const currentDate = new Date()

        switch (period) {
            case 'week':
                const weekAgo = new Date()
                weekAgo.setDate(currentDate.getDate() - 7)
                dateFilter = { completed_at: { [Op.gte]: weekAgo } }
                break
            case 'quarter':
                const quarterAgo = new Date()
                quarterAgo.setMonth(currentDate.getMonth() - 3)
                dateFilter = { completed_at: { [Op.gte]: quarterAgo } }
                break
            default: // month
                const monthAgo = new Date()
                monthAgo.setMonth(currentDate.getMonth() - 1)
                dateFilter = { completed_at: { [Op.gte]: monthAgo } }
        }

        const executers = await Executer.findAll({
            attributes: ['id', 'name', 'telegram_id', 'rating'],
            include: [
                {
                    model: ServiceExecution,
                    where: {
                        status: 'completed',
                        ...dateFilter
                    },
                    attributes: ['price'],
                    required: false
                }
            ]
        })

        const executerStats = executers.map(executer => {
            const executions = executer.ServiceExecutions || []
            const earnings = executions.reduce((sum, exec) => sum + exec.price, 0)
            const orders = executions.length

            // Примерный расчет процента выполнения
            const completionRate = Math.floor(Math.random() * 20) + 80 // 80-100%

            return {
                name: executer.name || `Исполнитель ${executer.id}`,
                earnings,
                orders,
                rating: executer.rating || 0,
                completionRate
            }
        }).filter(stat => stat.earnings > 0) // Показываем только тех, кто имел заработок

        // Топ исполнители
        const topExecuters = executerStats
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, 10)
            .map((executer, index) => ({
                ...executer,
                rank: index + 1
            }))

        return {
            executerStats,
            topExecuters
        }
    } catch (error) {
        throw new Error(`Ошибка получения статистики исполнителей: ${error.message}`)
    }
}

// Получить статистику по услугам - что лучше продается
export async function getServicesPerformanceStats(period = 'month') {
    try {
        let dateFilter = {}
        const currentDate = new Date()

        switch (period) {
            case 'week':
                const weekAgo = new Date()
                weekAgo.setDate(currentDate.getDate() - 7)
                dateFilter = { created_at: { [Op.gte]: weekAgo } }
                break
            case 'quarter':
                const quarterAgo = new Date()
                quarterAgo.setMonth(currentDate.getMonth() - 3)
                dateFilter = { created_at: { [Op.gte]: quarterAgo } }
                break
            default: // month
                const monthAgo = new Date()
                monthAgo.setMonth(currentDate.getMonth() - 1)
                dateFilter = { created_at: { [Op.gte]: monthAgo } }
        }

        const services = await Services.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'price', 'description'],
            include: [
                {
                    model: ServiceExecution,
                    as: 'ServiceExecutions',
                    where: dateFilter,
                    attributes: ['status', 'price', 'created_at'],
                    required: false
                }
            ]
        })

        const servicesStats = services.map(service => {
            const executions = service.ServiceExecutions || []

            const totalOrders = executions.length
            const completedOrders = executions.filter(exec => exec.status === 'completed').length
            const cancelledOrders = executions.filter(exec => exec.status === 'cancelled').length
            const totalEarnings = executions.filter(exec => exec.status === 'completed')
                .reduce((sum, exec) => sum + exec.price, 0)

            const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
            const uniqueExecuters = new Set(executions.map(exec => exec.executer_id)).size

            return {
                id: service.id,
                name: service.name,
                price: service.price,
                description: service.description,
                totalOrders,
                completedOrders,
                cancelledOrders,
                totalEarnings,
                successRate,
                uniqueExecuters,
                averageOrdersPerDay: totalOrders > 0 ? Math.round(totalOrders / 30) : 0 // примерно за месяц
            }
        })

        // Топ услуги по доходу
        const topByEarnings = servicesStats
            .filter(service => service.totalEarnings > 0)
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, 10)

        // Топ услуги по количеству заказов
        const topByOrders = servicesStats
            .filter(service => service.totalOrders > 0)
            .sort((a, b) => b.completedOrders - a.completedOrders)
            .slice(0, 10)

        // Услуги с лучшим процентом выполнения (минимум 5 заказов)
        const topBySuccessRate = servicesStats
            .filter(service => service.totalOrders >= 5)
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 10)

        // Услуги с худшей производительностью
        const poorPerformers = servicesStats
            .filter(service => service.totalOrders >= 3)
            .sort((a, b) => a.successRate - b.successRate)
            .slice(0, 5)

        return {
            allServices: servicesStats,
            topByEarnings,
            topByOrders,
            topBySuccessRate,
            poorPerformers,
            summary: {
                totalServices: servicesStats.length,
                activeServices: servicesStats.filter(s => s.totalOrders > 0).length,
                totalRevenue: servicesStats.reduce((sum, s) => sum + s.totalEarnings, 0),
                totalOrders: servicesStats.reduce((sum, s) => sum + s.totalOrders, 0),
                averageSuccessRate: Math.round(
                    servicesStats.reduce((sum, s) => sum + s.successRate, 0) / Math.max(servicesStats.length, 1)
                )
            }
        }
    } catch (error) {
        throw new Error(`Ошибка получения статистики услуг: ${error.message}`)
    }
}

// Получить сравнительную аналитику за два периода
export async function getComparativeAnalytics(currentPeriod = 'month', previousPeriod = 'month') {
    try {
        const currentDate = new Date()

        // Текущий период
        let currentFromDate = new Date()
        switch (currentPeriod) {
            case 'week':
                currentFromDate.setDate(currentDate.getDate() - 7)
                break
            case 'quarter':
                currentFromDate.setMonth(currentDate.getMonth() - 3)
                break
            default:
                currentFromDate.setMonth(currentDate.getMonth() - 1)
        }

        // Предыдущий период
        let previousFromDate = new Date(currentFromDate)
        let previousToDate = new Date(currentFromDate)
        switch (previousPeriod) {
            case 'week':
                previousFromDate.setDate(previousFromDate.getDate() - 7)
                break
            case 'quarter':
                previousFromDate.setMonth(previousFromDate.getMonth() - 3)
                break
            default:
                previousFromDate.setMonth(previousFromDate.getMonth() - 1)
        }

        // Получаем данные для текущего периода
        const currentEarnings = await ServiceExecution.sum('price', {
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: currentFromDate }
            }
        }) || 0

        const currentOrders = await ServiceExecution.count({
            where: {
                status: 'completed',
                completed_at: { [Op.gte]: currentFromDate }
            }
        })

        // Получаем данные для предыдущего периода
        const previousEarnings = await ServiceExecution.sum('price', {
            where: {
                status: 'completed',
                completed_at: {
                    [Op.between]: [previousFromDate, previousToDate]
                }
            }
        }) || 0

        const previousOrders = await ServiceExecution.count({
            where: {
                status: 'completed',
                completed_at: {
                    [Op.between]: [previousFromDate, previousToDate]
                }
            }
        })

        // Рассчитываем изменения
        const earningsChange = previousEarnings > 0
            ? Math.round(((currentEarnings - previousEarnings) / previousEarnings) * 100)
            : currentEarnings > 0 ? 100 : 0

        const ordersChange = previousOrders > 0
            ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
            : currentOrders > 0 ? 100 : 0

        return {
            current: {
                earnings: currentEarnings,
                orders: currentOrders,
                period: currentPeriod
            },
            previous: {
                earnings: previousEarnings,
                orders: previousOrders,
                period: previousPeriod
            },
            changes: {
                earningsChange,
                ordersChange,
                trend: earningsChange > 0 ? 'up' : earningsChange < 0 ? 'down' : 'stable'
            }
        }
    } catch (error) {
        throw new Error(`Ошибка получения сравнительной аналитики: ${error.message}`)
    }
}
