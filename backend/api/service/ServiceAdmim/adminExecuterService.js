import { Executer, Order } from "../../../database/dbTables.js";

export async function getAllExecuters() {
    try {
        const executers = await Executer.findAll({
            order: [['create_date_executer', 'DESC']] // исправлено поле
        });
        return executers;
    } catch (error) {
        throw new Error(`Error fetching executers: ${error.message}`);
    }
}

export async function getExecuterById(id) {
    try {
        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }
        return executer;
    } catch (error) {
        throw new Error(`Error fetching executer: ${error.message}`);
    }
}

export async function getExecuterByTelegramId(telegramId) {
    try {
        const executer = await Executer.findOne({
            where: { telegram_id: telegramId }
        });
        return executer;
    } catch (error) {
        throw new Error(`Error fetching executer by telegram ID: ${error.message}`);
    }
}

export async function addExecuter(data) {
    try {
        const {
            name,
            telegram_id,
            rating = 0,
            status = 'active'
        } = data;

        if (!telegram_id) {
            throw new Error('Telegram ID is required');
        }

        // Проверяем уникальность telegram_id
        const existingExecuter = await Executer.findOne({
            where: { telegram_id }
        });
        if (existingExecuter) {
            throw new Error('Исполнитель с таким Telegram ID уже существует');
        }

        const newExecuter = await Executer.create({
            name,
            telegram_id,
            rating,
            status
        });
        return newExecuter;
    } catch (error) {
        throw new Error(`Error creating executer: ${error.message}`);
    }
}

export async function updateExecuter(id, data) {
    try {
        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        const updatedExecuter = await executer.update(data);
        return updatedExecuter;
    } catch (error) {
        throw new Error(`Error updating executer: ${error.message}`);
    }
}

export async function deleteExecuter(id) {
    try {
        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        // Проверяем нет ли активных заказов
        const activeOrders = await Order.count({
            where: {
                executer_id: id,
                status: ['pending', 'in_progress']
            }
        });

        if (activeOrders > 0) {
            throw new Error('Cannot delete executer with active orders');
        }

        await executer.destroy();
        return { message: 'Executer deleted successfully' };
    } catch (error) {
        throw new Error(`Error deleting executer: ${error.message}`);
    }
}

export async function getExecuterStats() {
    try {
        const total = await Executer.count();
        const active = await Executer.count({ where: { status: 'active' } });
        const inactive = await Executer.count({ where: { status: 'inactive' } });
        const blocked = await Executer.count({ where: { status: 'blocked' } });

        return {
            total,
            active,
            inactive,
            blocked
        };
    } catch (error) {
        throw new Error(`Error fetching executer stats: ${error.message}`);
    }
}

export async function getExecuterWithOrderStats(id) {
    try {
        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        const totalOrders = await Order.count({
            where: { executer_id: id }
        });

        const completedOrders = await Order.count({
            where: {
                executer_id: id,
                status: 'completed'
            }
        });

        const activeOrders = await Order.count({
            where: {
                executer_id: id,
                status: ['pending', 'in_progress']
            }
        });

        return {
            ...executer.dataValues,
            orderStats: {
                total: totalOrders,
                completed: completedOrders,
                active: activeOrders
            }
        };
    } catch (error) {
        throw new Error(`Error fetching executer with stats: ${error.message}`);
    }
}

export async function updateExecuterRating(id, newRating) {
    try {
        if (newRating < 0 || newRating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }

        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        const updatedExecuter = await executer.update({ rating: newRating });
        return updatedExecuter;
    } catch (error) {
        throw new Error(`Error updating executer rating: ${error.message}`);
    }
}
