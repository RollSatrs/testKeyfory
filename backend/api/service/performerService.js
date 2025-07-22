import { Performer, Order } from "../../database/dbTables.js";

export async function getAllPerformers() {
    try {
        const performers = await Performer.findAll({
            order: [['createdAt', 'DESC']]
        });
        return performers;
    } catch (error) {
        throw new Error(`Error fetching performers: ${error.message}`);
    }
}

export async function getPerformerById(id) {
    try {
        const performer = await Performer.findByPk(id);
        if (!performer) {
            throw new Error('Performer not found');
        }
        return performer;
    } catch (error) {
        throw new Error(`Error fetching performer: ${error.message}`);
    }
}

export async function getPerformerByTelegramId(telegramId) {
    try {
        const performer = await Performer.findOne({
            where: { telegram_id: telegramId }
        });
        return performer;
    } catch (error) {
        throw new Error(`Error fetching performer by telegram ID: ${error.message}`);
    }
}

export async function addPerformer(data) {
    try {
        const {
            telegram_id,
            username,
            rating = 0,
            status = 'active',
            specializations = []
        } = data;

        if (!telegram_id || !username) {
            throw new Error('Telegram ID and username are required');
        }

        // Проверяем уникальность telegram_id
        const existingPerformer = await Performer.findOne({
            where: { telegram_id }
        });
        if (existingPerformer) {
            throw new Error('Performer with this telegram ID already exists');
        }

        const newPerformer = await Performer.create({
            telegram_id,
            username,
            rating,
            status,
            specializations
        });
        return newPerformer;
    } catch (error) {
        throw new Error(`Error creating performer: ${error.message}`);
    }
}

export async function updatePerformer(id, data) {
    try {
        const performer = await Performer.findByPk(id);
        if (!performer) {
            throw new Error('Performer not found');
        }

        const updatedPerformer = await performer.update(data);
        return updatedPerformer;
    } catch (error) {
        throw new Error(`Error updating performer: ${error.message}`);
    }
}

export async function deletePerformer(id) {
    try {
        const performer = await Performer.findByPk(id);
        if (!performer) {
            throw new Error('Performer not found');
        }

        // Проверяем нет ли активных заказов
        const activeOrders = await Order.count({
            where: {
                performer_id: id,
                status: ['pending', 'in_progress']
            }
        });

        if (activeOrders > 0) {
            throw new Error('Cannot delete performer with active orders');
        }

        await performer.destroy();
        return { message: 'Performer deleted successfully' };
    } catch (error) {
        throw new Error(`Error deleting performer: ${error.message}`);
    }
}

export async function getPerformerStats() {
    try {
        const total = await Performer.count();
        const active = await Performer.count({ where: { status: 'active' } });
        const inactive = await Performer.count({ where: { status: 'inactive' } });
        const blocked = await Performer.count({ where: { status: 'blocked' } });

        return {
            total,
            active,
            inactive,
            blocked
        };
    } catch (error) {
        throw new Error(`Error fetching performer stats: ${error.message}`);
    }
}

export async function getPerformerWithOrderStats(id) {
    try {
        const performer = await Performer.findByPk(id);
        if (!performer) {
            throw new Error('Performer not found');
        }

        const totalOrders = await Order.count({
            where: { performer_id: id }
        });

        const completedOrders = await Order.count({
            where: {
                performer_id: id,
                status: 'completed'
            }
        });

        const activeOrders = await Order.count({
            where: {
                performer_id: id,
                status: ['pending', 'in_progress']
            }
        });

        return {
            ...performer.dataValues,
            orderStats: {
                total: totalOrders,
                completed: completedOrders,
                active: activeOrders
            }
        };
    } catch (error) {
        throw new Error(`Error fetching performer with stats: ${error.message}`);
    }
}

export async function updatePerformerRating(id, newRating) {
    try {
        if (newRating < 0 || newRating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }

        const performer = await Performer.findByPk(id);
        if (!performer) {
            throw new Error('Performer not found');
        }

        const updatedPerformer = await performer.update({ rating: newRating });
        return updatedPerformer;
    } catch (error) {
        throw new Error(`Error updating performer rating: ${error.message}`);
    }
}
