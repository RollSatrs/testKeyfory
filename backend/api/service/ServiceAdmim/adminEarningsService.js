import { ExecuterEarnings, Executer, Services, Order } from '../../../database/dbTables.js';
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

            return earnings;
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
}

export default new AdminEarningsService();
