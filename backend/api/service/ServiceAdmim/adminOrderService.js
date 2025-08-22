import { Order, Services, Executer } from "../../../database/dbTables.js";

export async function getAllOrders() {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: Services,
                    as: 'Service',
                    attributes: ['name', 'category']
                },
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['name', 'telegram_id', 'rating']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return orders;
    } catch (error) {
        throw new Error(`Error fetching orders: ${error.message}`);
    }
}

export async function getOrderById(id) {
    try {
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: Services,
                    as: 'Service',
                    attributes: ['name', 'category']
                },
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['name', 'telegram_id', 'rating']
                }
            ]
        });
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    } catch (error) {
        throw new Error(`Error fetching order: ${error.message}`);
    }
}

export async function addOrder(data) {
    try {
        const {
            service_id,
            executer_id,
            total_sum,
            status = 'pending',
            payment_status = 'pending',
            details = {},
            materials = []
        } = data;

        if (!service_id || !executer_id) {
            throw new Error('Service ID and executer ID are required');
        }

        // Проверяем существование услуги
        const service = await Services.findByPk(service_id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Проверяем существование исполнителя
        const executer = await Executer.findByPk(executer_id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        const newOrder = await Order.create({
            service_id,
            executer_id: executer_id,
            total_sum: parseFloat(total_sum),
            status,
            payment_status,
            details: {
                ...details,
                materials: materials
            },
            created_at: new Date()
        });

        return newOrder;
    } catch (error) {
        throw new Error(`Error creating order: ${error.message}`);
    }
}

export async function updateOrder(id, data) {
    try {
        const order = await Order.findByPk(id);
        if (!order) {
            throw new Error('Order not found');
        }

        const updatedOrder = await order.update(data);
        return updatedOrder;
    } catch (error) {
        throw new Error(`Error updating order: ${error.message}`);
    }
}

export async function deleteOrder(id) {
    try {
        const order = await Order.findByPk(id);
        if (!order) {
            throw new Error('Order not found');
        }

        await order.destroy();
        return { message: 'Order deleted successfully' };
    } catch (error) {
        throw new Error(`Error deleting order: ${error.message}`);
    }
}

export async function getOrderStats() {
    try {
        const total = await Order.count();
        const pending = await Order.count({ where: { status: 'pending' } });
        const in_progress = await Order.count({ where: { status: 'in_progress' } });
        const completed = await Order.count({ where: { status: 'completed' } });
        const cancelled = await Order.count({ where: { status: 'cancelled' } });

        return {
            total,
            pending,
            in_progress,
            completed,
            cancelled
        };
    } catch (error) {
        throw new Error(`Error fetching order stats: ${error.message}`);
    }
}

export async function getOrdersByExecuter(executerId) {
    try {
        const orders = await Order.findAll({
            where: { executer_id: executerId },
            include: [
                {
                    model: Services,
                    as: 'Service',
                    attributes: ['name', 'category']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return orders;
    } catch (error) {
        throw new Error(`Error fetching orders by executer: ${error.message}`);
    }
}

export async function getOrdersByService(serviceId) {
    try {
        const orders = await Order.findAll({
            where: { service_id: serviceId },
            include: [
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['name', 'telegram_id', 'rating']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return orders;
    } catch (error) {
        throw new Error(`Error fetching orders by service: ${error.message}`);
    }
}

// Server-side aggregation: top performers counts (completed orders) for week/month
export async function getTopPerformers(take = 4) {
    try {
        const { sequelize } = await import('../../../database/databaseOn.js');
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const sql = `
            SELECT e.id as executer_id, e.name, e.rating,
                COUNT(*) FILTER (WHERE o.created_at >= :weekAgo AND o.status = 'completed') AS week_count,
                COUNT(*) FILTER (WHERE o.created_at >= :monthAgo AND o.status = 'completed') AS month_count,
                COUNT(*) FILTER (WHERE o.status = 'completed') AS total_completed
            FROM orders o
            JOIN executers e ON e.id = o.executer_id
            GROUP BY e.id, e.name, e.rating
            ORDER BY week_count DESC, month_count DESC, total_completed DESC
            LIMIT :take
        `;

        // QueryTypes is available on Sequelize constructor
        const { QueryTypes } = (await import('sequelize'));
        const results = await sequelize.query(sql, {
            replacements: { weekAgo, monthAgo, take },
            type: QueryTypes.SELECT
        });

        // Normalize numeric strings to numbers
        return results.map(r => ({
            executer_id: r.executer_id,
            name: r.name,
            rating: r.rating,
            ordersWeek: Number(r.week_count || 0),
            ordersMonth: Number(r.month_count || 0),
            totalOrders: Number(r.total_completed || 0)
        }));
    } catch (error) {
        throw new Error(`Error fetching top performers: ${error.message}`);
    }
}
