import { Executer, Order, Services, ServiceAccess, Log, Material } from "../../../database/dbTables.js";
import { sequelize } from "../../../database/databaseOn.js";
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
        console.log(`👥 Запрос всех исполнителей из базы данных...`);

        const executers = await Executer.findAll({
            order: [['create_date_executer', 'DESC']] // исправлено поле
        });

        console.log(`📊 Найдено исполнителей в БД: ${executers.length}`);
        executers.forEach(exec => {
            console.log(`  - Исполнитель ${exec.id}: статус=${exec.status}, имя=${exec.name}`);
        });

        const result = [];

        for (const executer of executers) {
            // Получаем назначенные услуги для каждого исполнителя двумя способами:

            // 1. Через ServiceAccess (доступ к услугам)
            const serviceAccess = await ServiceAccess.findAll({
                where: { executer_id: executer.id },
                include: [
                    {
                        model: Services,
                        foreignKey: 'service_id',
                        attributes: ['id', 'name', 'category', 'status', 'price']
                    }
                ]
            });

            // 2. Через прямое назначение (executer_id в Services)
            const directlyAssignedServices = await Services.findAll({
                where: { executer_id: executer.id },
                attributes: ['id', 'name', 'category', 'status', 'price']
            });

            // Объединяем услуги из ServiceAccess
            const accessServices = serviceAccess.map(access => ({
                service_id: access.service_id,
                service_name: access.Service?.name || `ID: ${access.service_id}`,
                service_category: access.Service?.category,
                service_status: access.Service?.status,
                service_price: access.Service?.price,
                has_access: access.has_access,
                can_replace_materials: access.can_replace_materials,
                assigned_at: access.created_at,
                assignment_type: 'access'
            }));

            // Добавляем прямо назначенные услуги
            const directServices = directlyAssignedServices.map(service => ({
                service_id: service.id,
                service_name: service.name,
                service_category: service.category,
                service_status: service.status,
                service_price: service.price,
                has_access: true,
                can_replace_materials: true, // предполагаем полные права для прямого назначения
                assigned_at: service.created_at,
                assignment_type: 'direct'
            }));

            // Объединяем и убираем дубликаты
            const allServices = [...accessServices, ...directServices];
            const uniqueServices = allServices.filter((service, index, self) =>
                index === self.findIndex(s => s.service_id === service.service_id)
            );

            // Получаем материалы исполнителя
            const materials = await Material.findAll({
                where: { executer_id: executer.id },
                attributes: ['id', 'type_key', 'status', 'contents']
            });

            console.log(`👤 Исполнитель ${executer.id}: ServiceAccess: ${accessServices.length}, Direct: ${directServices.length}, Total: ${uniqueServices.length}, Materials: ${materials.length}`);

            result.push({
                ...executer.dataValues,
                assigned_services: uniqueServices,
                materials: materials.map(material => material.dataValues)
            });
        }

        console.log(`✅ Возвращаем ${result.length} исполнителей с полной информацией`);
        return result;
    } catch (error) {
        console.error(`❌ Ошибка получения всех исполнителей:`, error);
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
        // Получаем исполнителя для уведомлений
        const executer = await Executer.findByPk(executerId, {
            attributes: ['id', 'name', 'telegram_id']
        });

        if (!executer) {
            throw new Error('Исполнитель не найден');
        }

        // Получаем текущие права для сравнения
        const oldRights = await ServiceAccess.findAll({
            where: { executer_id: executerId },
            include: [{
                model: Services,
                attributes: ['id', 'name', 'category', 'price']
            }]
        });

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

        // Определяем новые назначенные услуги (has_access = true)
        const newAssignedServices = rights.filter(right => right.has_access);
        const oldAssignedIds = new Set(oldRights.filter(r => r.has_access).map(r => r.service_id));
        const actuallyNewServices = newAssignedServices.filter(right => !oldAssignedIds.has(right.service_id));

        // Отправляем уведомление только если есть новые назначенные услуги
        if (actuallyNewServices.length > 0 && executer.telegram_id) {
            try {
                const fetch = (await import('node-fetch')).default;
                const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

                // Получаем полную информацию о новых услугах
                const newServicesInfo = [];
                for (const right of actuallyNewServices) {
                    const service = await Services.findByPk(right.service_id, {
                        attributes: ['id', 'name', 'category', 'price']
                    });
                    if (service) {
                        newServicesInfo.push({
                            id: service.id,
                            name: service.name,
                            category: service.category,
                            price: service.price
                        });
                    }
                }

                if (newServicesInfo.length > 0) {
                    const notificationResponse = await fetch(`${API_BASE_URL}/api/executers-bot/notify-service-assigned`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            telegram_id: executer.telegram_id,
                            executer_name: executer.name || 'Исполнитель',
                            services: newServicesInfo,
                            admin_name: 'Администратор'
                        })
                    });

                    if (notificationResponse.ok) {
                        console.log(`📢 Уведомление об обновлении прав отправлено исполнителю ${executer.name} (ID: ${executerId}), новых услуг: ${newServicesInfo.length}`);
                    } else {
                        console.warn(`⚠️ Не удалось отправить уведомление об обновлении прав исполнителю ${executerId}: ${notificationResponse.status}`);
                    }
                }
            } catch (notifyError) {
                console.error('❌ Ошибка отправки уведомления об обновлении прав:', notifyError.message);
                // Не прерываем процесс обновления прав, если уведомление не отправилось
            }
        }

        return { success: true, message: 'Права обновлены' };
    } catch (error) {
        throw new Error(`Error updating executer rights: ${error.message}`);
    }
}

// Получить все логи
export async function getAllLogs(options = {}) {
    try {
        const { limit = 100, offset = 0, user_type, action, executor_id } = options;

        const whereClause = {};
        if (user_type) whereClause.user_type = user_type;
        if (action) whereClause.action = action;
        if (executor_id) whereClause.user_id = executor_id;

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
        // Преобразуем telegramId в число, чтобы избежать ошибки типов
        const numericTelegramId = parseInt(telegramId);
        if (isNaN(numericTelegramId)) {
            throw new Error(`Invalid telegram ID: ${telegramId}`);
        }

        const executer = await Executer.findOne({
            where: { telegram_id: numericTelegramId }
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

        // Используем транзакцию для создания исполнителя и его ограничений
        const { sequelize } = await import('../../../database/databaseOn.js');
        const { ExecuterLimits } = await import('../../../database/dbTables.js');

        const result = await sequelize.transaction(async (t) => {
            // Создаем исполнителя
            const newExecuter = await Executer.create({
                name,
                telegram_id,
                rating,
                status: 'inactive' // новые исполнители неактивны до первого действия
            }, { transaction: t });

            // Автоматически создаем общий лимит (без ограничений) для нового исполнителя
            await ExecuterLimits.create({
                executer_id: newExecuter.id,
                service_id: null, // общий лимит
                max_limit: null, // без ограничений (∞)
                current_active: 0
            }, { transaction: t });

            console.log(`✅ Создан исполнитель ${newExecuter.id} с автоматическим общим лимитом`);

            return newExecuter;
        });

        // После успешного создания отправляем уведомление в бот
        try {
            const fetch = (await import('node-fetch')).default;
            const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

            const notificationResponse = await fetch(`${API_BASE_URL}/api/executers-bot/notify-executer-added`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegram_id: result.telegram_id,
                    executer_name: result.name || 'Исполнитель',
                    admin_name: 'Администратор'
                })
            });

            if (notificationResponse.ok) {
                console.log(`📢 Уведомление о добавлении исполнителя ${result.id} отправлено в бот`);
            } else {
                console.warn(`⚠️ Не удалось отправить уведомление исполнителю ${result.id}: ${notificationResponse.status}`);
            }
        } catch (notifyError) {
            console.error('❌ Ошибка отправки уведомления в бот:', notifyError.message);
            // Не прерываем процесс создания исполнителя, если уведомление не отправилось
        }

        return result;
    } catch (error) {
        throw new Error(`Error creating executer: ${error.message}`);
    }
}

export async function updateExecuter(id, data) {
    try {
        console.log(`🔄 Начинаем обновление исполнителя ${id} с данными:`, data);

        const executer = await Executer.findByPk(id);
        if (!executer) {
            throw new Error('Executer not found');
        }

        console.log(`📋 Исполнитель ${id} найден, текущий статус: ${executer.status}`);

        // Запоминаем старый статус для сравнения
        const oldStatus = executer.status;
        const newStatus = data.status;

        // Обновляем исполнителя (теперь включаем статус)
        const updatedExecuter = await executer.update(data);
        console.log(`✅ Исполнитель ${id} обновлен, новый статус: ${updatedExecuter.status}`);

        // Проверяем, что изменения действительно сохранились
        const verifyExecuter = await Executer.findByPk(id);
        console.log(`🔍 Проверка сохранения: исполнитель ${id} в БД имеет статус: ${verifyExecuter.status}`);

        // Если статус изменился на "blocked", отправляем уведомление
        if (oldStatus !== 'blocked' && newStatus === 'blocked') {
            console.log(`🚫 Исполнитель ${id} заблокирован, отправляем уведомление`);

            try {
                const fetch = (await import('node-fetch')).default;
                const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

                const notificationResponse = await fetch(`${API_BASE_URL}/api/executers-bot/notify-executer-blocked`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telegram_id: updatedExecuter.telegram_id,
                        executer_name: updatedExecuter.name || 'Исполнитель',
                        admin_name: 'Администратор',
                        reason: data.block_reason || null
                    })
                });

                if (notificationResponse.ok) {
                    console.log(`📢 Уведомление о блокировке исполнителя ${id} отправлено в бот`);
                } else {
                    console.warn(`⚠️ Не удалось отправить уведомление о блокировке исполнителю ${id}: ${notificationResponse.status}`);
                }
            } catch (notifyError) {
                console.error('❌ Ошибка отправки уведомления о блокировке в бот:', notifyError.message);
                // Не прерываем процесс обновления исполнителя, если уведомление не отправилось
            }
        }

        // Если статус изменился с "blocked" на "active" или "on_moderation", отправляем уведомление о разблокировке
        if (oldStatus === 'blocked' && (newStatus === 'active' || newStatus === 'on_moderation')) {
            console.log(`🟢 Исполнитель ${id} разблокирован, отправляем уведомление`);

            try {
                const fetch = (await import('node-fetch')).default;
                const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

                const notificationResponse = await fetch(`${API_BASE_URL}/api/executers-bot/notify-executer-unblocked`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telegram_id: updatedExecuter.telegram_id,
                        executer_name: updatedExecuter.name || 'Исполнитель',
                        admin_name: 'Администратор'
                    })
                });

                if (notificationResponse.ok) {
                    console.log(`📢 Уведомление о разблокировке исполнителя ${id} отправлено в бот`);
                } else {
                    console.warn(`⚠️ Не удалось отправить уведомление о разблокировке исполнителю ${id}: ${notificationResponse.status}`);
                }
            } catch (notifyError) {
                console.error('❌ Ошибка отправки уведомления о разблокировке в бот:', notifyError.message);
                // Не прерываем процесс обновления исполнителя, если уведомление не отправилось
            }
        }

        return updatedExecuter;
    } catch (error) {
        console.error(`❌ Ошибка обновления исполнителя ${id}:`, error);
        throw new Error(`Error updating executer: ${error.message}`);
    }
}export async function deleteExecuter(id) {
    try {
        // Use a transaction for cleanup
        const t = await sequelize.transaction();
        try {
            const executer = await Executer.findByPk(id, { transaction: t });
            if (!executer) {
                throw new Error('Executer not found');
            }

            // Проверяем активность исполнителя и наличие активных заказов
            if (executer.status === 'active') {
                const activeOrders = await Order.count({
                    where: {
                        executer_id: id,
                        status: ['pending', 'in_progress']
                    },
                    transaction: t
                });

                if (activeOrders > 0) {
                    throw new Error('Cannot delete active executer with active orders. Deactivate executer first.');
                }
            }

            // Remove materials assigned to this executer (they should be cleaned up)
            await Material.destroy({ where: { executer_id: id }, transaction: t });

            // Remove service access entries
            await ServiceAccess.destroy({ where: { executer_id: id }, transaction: t });

            // Finally delete executer
            await executer.destroy({ transaction: t });

            await t.commit();
            return { message: 'Executer and related materials deleted successfully' };
        } catch (err) {
            await t.rollback();
            throw err;
        }
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
