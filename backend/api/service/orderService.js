import { Order, Services, Executer } from "../../database/dbTables.js";

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
