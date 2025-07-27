import { Executer, Order, Services, ServiceAccess, Log } from "../../../database/dbTables.js";
import { Op } from 'sequelize';

// Обновить статус исполнителя на основе активности
export async function updateExecuterActivity(executerId) {
    try {
        const executer = await Executer.findByPk(executerId);
        if (!executer) {
            throw new Error('Executer not found');
        }

        // Обновляем время последней активности и устанавливаем статус active
        await executer.update({
            last_activity: new Date(),
            status: 'active'
        });

        return executer;
    } catch (error) {
        throw new Error(`Error updating executer activity: ${error.message}`);
    }
}

// Проверить и обновить статусы неактивных исполнителей
export async function checkInactiveExecuters() {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 минут назад

        // Найти всех активных исполнителей, которые не проявляли активность более 30 минут
        const inactiveExecuters = await Executer.findAll({
            where: {
                status: 'active',
                last_activity: {
                    [Op.lt]: thirtyMinutesAgo
                }
            }
        });

        // Обновить их статус на inactive
        for (const executer of inactiveExecuters) {
            await executer.update({ status: 'inactive' });

            // Логируем изменение статуса
            await createLog({
                user_id: executer.id,
                user_type: 'executer',
                action: 'status_changed',
                description: 'Статус изменен на неактивный из-за отсутствия активности более 30 минут'
            });
        }

        return inactiveExecuters.length;
    } catch (error) {
        throw new Error(`Error checking inactive executers: ${error.message}`);
    }
}

// Создать запись в логах
export async function createLog(logData) {
    try {
        const log = await Log.create(logData);
        return log;
    } catch (error) {
        throw new Error(`Error creating log: ${error.message}`);
    }
}

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

// Получить права исполнителя
export async function getExecuterRights(executerId) {
    try {
        const rights = await ServiceAccess.findAll({
            where: { executer_id: executerId },
            include: [
                {
                    model: Services,
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        // Если прав нет, создаем базовые права для всех услуг
        if (rights.length === 0) {
            const services = await Services.findAll();
            const defaultRights = services.map(service => ({
                service_id: service.id,
                has_access: false,
                can_replace_materials: false,
                requires_approval: true,
                Service: service
            }));
            return defaultRights;
        }

        return rights;
    } catch (error) {
        throw new Error(`Error fetching executer rights: ${error.message}`);
    }
}

// Обновить права исполнителя
export async function updateExecuterRights(executerId, rights) {
    try {
        // Удаляем существующие права
        await ServiceAccess.destroy({
            where: { executer_id: executerId }
        });

        // Создаем новые права
        const newRights = rights.map(right => ({
            executer_id: executerId,
            service_id: right.service_id,
            has_access: right.has_access,
            can_replace_materials: right.can_replace_materials,
            requires_approval: right.requires_approval
        }));

        await ServiceAccess.bulkCreate(newRights);

        return { success: true, message: 'Права обновлены' };
    } catch (error) {
        throw new Error(`Error updating executer rights: ${error.message}`);
    }
}

// Получить все логи
export async function getAllLogs(options = {}) {
    try {
        const { limit = 100, offset = 0, user_type, action } = options;

        const whereClause = {};
        if (user_type) whereClause.user_type = user_type;
        if (action) whereClause.action = action;

        const logs = await Log.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Order,
                    required: false,
                    attributes: ['id'],
                    include: [
                        {
                            model: Services,
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Executer,
                    required: false,
                    attributes: ['id', 'name', 'telegram_id']
                }
            ]
        });

        return logs;
    } catch (error) {
        throw new Error(`Error fetching logs: ${error.message}`);
    }
}

// Получить заказы исполнителя
export async function getExecuterOrders(executerId) {
    try {
        const orders = await Order.findAll({
            where: { executer_id: executerId },
            include: [
                {
                    model: Services,
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return orders;
    } catch (error) {
        throw new Error(`Error fetching executer orders: ${error.message}`);
    }
}export async function getExecuterById(id) {
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
            rating = 0
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
            status: 'inactive' // новые исполнители неактивны до первого действия
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

        // Исключаем статус из данных для обновления (статус управляется автоматически)
        const { status, ...allowedData } = data;

        const updatedExecuter = await executer.update(allowedData);
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

        // Проверяем активность исполнителя и наличие активных заказов
        if (executer.status === 'active') {
            const activeOrders = await Order.count({
                where: {
                    executer_id: id,
                    status: ['pending', 'in_progress']
                }
            });

            if (activeOrders > 0) {
                throw new Error('Cannot delete active executer with active orders. Deactivate executer first.');
            }
        }

        // Если исполнитель неактивен, удаляем независимо от заказов
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
