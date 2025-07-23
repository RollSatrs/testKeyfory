import { Order, Services, Executer } from "../../database/dbTables.js";

export async function getAllOrders() {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: Services,
                    as: 'service',
                    attributes: ['name', 'category']
                },
                {
                    model: Executer,
                    as: 'executer',
                    attributes: ['telegram_id', 'rating']
                }
            ],
            order: [['createdAt', 'DESC']]
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
                    as: 'service',
                    attributes: ['name', 'category']
                },
                {
                    model: Executer,
                    as: 'executer',
                    attributes: ['telegram_id', 'rating']
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
            customer_telegram_id,
            service_id,
            executer_id,
            status = 'pending',
            details = {},
            amount
        } = data;

        if (!customer_telegram_id || !service_id) {
            throw new Error('Customer telegram ID and service ID are required');
        }

        // Проверяем существование услуги
        const service = await Services.findByPk(service_id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Проверяем существование исполнителя, если указан
        if (executer_id) {
            const executer = await Executer.findByPk(executer_id);
            if (!executer) {
                throw new Error('Executer not found');
            }
        }

        const newOrder = await Order.create({
            customer_telegram_id,
            service_id,
            executer_id,
            status,
            details,
            amount
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
                    as: 'service',
                    attributes: ['name', 'category']
                }
            ],
            order: [['createdAt', 'DESC']]
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
                    as: 'executer',
                    attributes: ['telegram_id', 'rating']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return orders;
    } catch (error) {
        throw new Error(`Error fetching orders by service: ${error.message}`);
    }
}
