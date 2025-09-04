import { Services, Material, ExecuterPricing, Executer, ServiceAccess, ServiceExecution, Admin, ExecuterServiceStatus } from "../../../database/dbTables.js";
import { sequelize } from "../../../database/databaseOn.js";
import { Op } from 'sequelize';
import { MATERIAL_STATUS, ORDER_STATUS } from '../../../constants/statusConstants.js';


export async function getAllServices(includeDeleted = false) {
    try {
        // Условие для фильтрации удаленных услуг
        const whereClause = includeDeleted ? {} : { is_deleted: false };

        const services = await Services.findAll({
            where: whereClause,
            include: [
                {
                    model: Executer,
                    as: 'assignedExecuter',
                    attributes: ['id', 'name', 'telegram_id', 'status'],
                    required: false
                },
                {
                    model: Admin,
                    as: 'deletedBy',
                    attributes: ['id', 'telegramId'], // используем telegramId вместо name
                    required: false
                }
            ],
            order: [['create_date_service', 'DESC']]
        });
        const result = [];

        for (const service of services) {
            // Получаем все материалы для услуги
            const materials = await Material.findAll({ where: { service_id: service.id } });

            // Считаем доступные ключи (исключаем использованные и замененные материалы)
            const availableKeys = materials.filter(m => {
                const status = m.status?.toLowerCase();
                return status !== MATERIAL_STATUS.USED.toLowerCase() &&
                       status !== 'использован' &&
                       status !== MATERIAL_STATUS.REPLACED.toLowerCase() &&
                       status !== 'заменен' &&
                       status !== 'replaced' &&
                       status !== 'pending_replace'
            }).length;

            // Получаем уникальные источники материалов для услуги
            const sources = [...new Set(materials.map(m => m.source))];

            // Получаем индивидуальные цены для исполнителей
            const customPricing = await ExecuterPricing.findAll({
                where: { service_id: service.id },
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name', 'telegram_id']
                    }
                ]
            });

            // Получаем назначенных исполнителей
            const assignedExecuters = await ServiceAccess.findAll({
                where: { service_id: service.id },
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name', 'telegram_id', 'status']
                    }
                ]
            });

            // Получаем все активные заказы для услуги с именами исполнителей
            // ИСКЛЮЧАЕМ завершённые заказы из активных
            const activeOrders = await ServiceExecution.findAll({
                where: {
                    service_id: service.id,
                    status: {
                        [Op.in]: [
                            ORDER_STATUS.PENDING,
                            ORDER_STATUS.IN_PROGRESS,
                            'active',
                            'pending_approval'
                        ],
                        [Op.not]: ORDER_STATUS.COMPLETED // Явно исключаем completed
                    }
                },
                include: [{
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name', 'telegram_id']
                }],
                attributes: ['order_number', 'status', 'executer_id', 'created_at'],
                order: [['created_at', 'DESC']]
            });

            // Получаем завершённые заказы для индикации "ВЫПОЛНЕН" в админке
            const completedOrders = await ServiceExecution.findAll({
                where: {
                    service_id: service.id,
                    status: ORDER_STATUS.COMPLETED
                },
                include: [{
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name']
                }],
                attributes: ['order_number', 'status', 'executer_id', 'completed_at'],
                order: [['completed_at', 'DESC']],
                limit: 20
            });

            // Build a deduplicated list of order entries combining ServiceExecution and Material.order_number
            const ordersMap = new Map();

            // From ServiceExecution rows first (preserve order) - ТОЛЬКО активные заказы
            for (const o of activeOrders) {
                const num = o.order_number || null;
                if (num) {
                    ordersMap.set(num, {
                        order_number: num,
                        executer_id: o.executer_id,
                        executer_name: o.Executer?.name || null,
                        status: o.status || null,
                        source: 'execution'
                    });
                }
            }

            // Then add any order_numbers present directly on materials (fallback)
            // НО ИСКЛЮЧАЕМ завершённые заказы из материалов
            for (const m of materials) {
                if (m.order_number) {
                    const num = m.order_number;

                    // Проверяем, не является ли этот заказ завершённым
                    const isCompletedOrder = completedOrders.some(co =>
                        (co.order_number && String(co.order_number) === String(num))
                    );

                    // Добавляем только если заказ НЕ завершён и ещё не добавлен
                    if (!isCompletedOrder && !ordersMap.has(num)) {
                        ordersMap.set(num, {
                            order_number: num,
                            executer_id: m.executer_id || null,
                            executer_name: m.executer_name || null,
                            status: m.status || null,
                            source: 'material'
                        });
                    }
                }
            }

            const active_orders_array = Array.from(ordersMap.values());

            // Получаем индивидуальные статусы исполнителей
            const executerStatuses = await ExecuterServiceStatus.findAll({
                where: { service_id: service.id },
                include: [{
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name', 'telegram_id', 'status', 'is_bot_active'] // 🔧 Добавили status и is_bot_active
                }]
            });

            result.push({
                ...service.dataValues,
                source: sources.join(', ') || '-',
                available_keys: availableKeys,
                active_orders: active_orders_array,
                // Количество и пример завершённых заказов для отображения статуса
                completed_count: completedOrders.length,
                completed_orders: completedOrders.map(co => ({ order_number: co.order_number, executer_name: co.Executer?.name || null, completed_at: co.completed_at })),
                custom_pricing: customPricing.map(pricing => ({
                    executer_id: pricing.executer_id,
                    executer_name: pricing.Executer?.name || `Исполнитель ${pricing.executer_id}`,
                    custom_price: pricing.custom_price
                })),
                assigned_executers: assignedExecuters.map(access => ({
                    executer_id: access.executer_id,
                    executer_name: access.Executer?.name || `ID: ${access.executer_id}`,
                    telegram_id: access.Executer?.telegram_id,
                    status: access.Executer?.status,
                    has_access: access.has_access
                })),
                // 🔄 НОВОЕ: Индивидуальные статусы исполнителей
                executer_statuses: executerStatuses.map(status => ({
                    executer_id: status.executer_id,
                    executer_name: status.Executer?.name || `ID: ${status.executer_id}`,
                    telegram_id: status.Executer?.telegram_id,
                    executer_status: status.Executer?.status, // 🆕 Статус самого исполнителя (active/inactive/blocked)
                    executer_is_bot_active: status.Executer?.is_bot_active, // 🆕 Реально онлайн в боте
                    service_status: status.status, // 🆕 Статус услуги для этого исполнителя (inactive/active/completed)
                    total_orders: status.total_orders,
                    created_at: status.created_at,
                    updated_at: status.updated_at
                }))
            });
        }
        return result;
    } catch (error) {
        throw new Error(`Error fetching services: ${error.message}`);
    }
}

export async function getServiceById(id) {
    try {
        const service = await Services.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }
        return service;
    } catch (error) {
        throw new Error(`Error fetching service: ${error.message}`);
    }
}

export async function addServiices(data) {
    try {
    const { name, category, price, loading_method, executer_id } = data;

        if (!name || !category) {
            throw new Error('Name and category are required');
        }

        // Правильно обрабатываем price - если пустая строка или undefined, ставим 0
        let validPrice = 0;
        if (price !== undefined && price !== null && price !== '') {
            validPrice = parseFloat(price);
            if (isNaN(validPrice)) {
                throw new Error('Price must be a valid number');
            }
        }

        // Новые услуги создаются без глобального статуса - используем индивидуальные статусы исполнителей
        const svcStatus = 'active'; // По умолчанию услуга активна

        // Определяем, является ли услуга расходной (цифровой) по категории
        const digitalCategories = [
            'Игры', 'Программное обеспечение', 'Образование', 'Развлечения', 'Музыка',
            'Видео и кино', 'Социальные сети', 'Облако и хостинг', 'Безопасность',
            'VPN и прокси', 'Дизайн и графика', 'Разработка', 'Фриланс',
            'Электронные книги', 'Новости и СМИ', 'Почта и коммуникации',
            'Финансы и банки', 'Онлайн-магазины', 'Здоровье и спорт',
            'Мобильные приложения', 'Фото и видео', 'Технологии',
            'Криптовалюты', 'Маркетинг', 'Общение и знакомства'
        ];
        const isConsumable = digitalCategories.includes(category);

        const newService = await Services.create({
            name,
            category,
            price: validPrice,
            status: svcStatus,
            loading_method: loading_method || 'manual',
            executer_id: executer_id || null,
            admin_id: 1,
            is_consumable: isConsumable // Устанавливаем флаг расходной услуги
        });
        return newService;
    } catch (error) {
        throw new Error(`Error creating service: ${error.message}`);
    }
}

export async function updateService(id, data) {
    try {
        const service = await Services.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Правильно обрабатываем price при обновлении
        if (data.price !== undefined) {
            if (data.price === null || data.price === '') {
                data.price = 0;
            } else {
                const validPrice = parseFloat(data.price);
                if (isNaN(validPrice)) {
                    throw new Error('Price must be a valid number');
                }
                data.price = validPrice;
            }
        }

        const updatedService = await service.update(data);
        return updatedService;
    } catch (error) {
        throw new Error(`Error updating service: ${error.message}`);
    }
}

export async function deleteService(id, adminId = null) {
    try {
        const service = await Services.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Проверяем, не удалена ли уже услуга
        if (service.is_deleted) {
            throw new Error('Service is already deleted');
        }

        // Выполняем soft delete
        const currentDate = new Date();
        await service.update({
            is_deleted: true,
            deleted_at: currentDate,
            deleted_by: adminId,
            archived_name: service.name, // Сохраняем оригинальное имя
            archived_category: service.category, // Сохраняем оригинальную категорию
            status: 'deleted' // Дополнительно помечаем статус
        });

        console.log(`✅ Услуга ${service.name} (ID: ${id}) помечена как удаленная`);

        return {
            message: 'Service soft deleted successfully',
            service_name: service.name,
            deleted_at: currentDate,
            softDeleted: true
        };
    } catch (error) {
        console.error('❌ Ошибка при soft delete услуги:', error);
        throw new Error(`Error deleting service: ${error.message}`);
    }
}

// Функция для восстановления удаленной услуги
export async function restoreService(id, adminId = null) {
    try {
        const service = await Services.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        if (!service.is_deleted) {
            throw new Error('Service is not deleted');
        }

        // Восстанавливаем услугу
        await service.update({
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
            status: 'active' // Возвращаем активный статус
        });

        console.log(`✅ Услуга ${service.name} (ID: ${id}) восстановлена`);

        return {
            message: 'Service restored successfully',
            service_name: service.name,
            restored_at: new Date()
        };
    } catch (error) {
        console.error('❌ Ошибка при восстановлении услуги:', error);
        throw new Error(`Error restoring service: ${error.message}`);
    }
}

// Функция для окончательного удаления (только для админа)
export async function permanentDeleteService(id) {
    try {
        const t = await sequelize.transaction();
        try {
            const service = await Services.findByPk(id, { transaction: t });
            if (!service) {
                throw new Error('Service not found');
            }

            // Удаляем связанные данные
            await Material.destroy({ where: { service_id: id }, transaction: t });
            await ServiceAccess.destroy({ where: { service_id: id }, transaction: t });
            await ExecuterPricing.destroy({ where: { service_id: id }, transaction: t });

            // Физически удаляем услугу
            await service.destroy({ transaction: t });

            await t.commit();
            return {
                message: 'Service permanently deleted',
                service_name: service.name
            };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        throw new Error(`Error permanently deleting service: ${error.message}`);
    }
}

export async function getServiceStats() {
    try {
        // Получаем статистику по индивидуальным статусам исполнителей
        const statusStats = await getServiceStatusesStats();

        // Также считаем общее количество услуг
        const totalServices = await Services.count({
            where: { is_deleted: false }
        });

        return {
            total: totalServices,
            active: statusStats.active || 0,
            inactive: statusStats.inactive || 0,
            completed: statusStats.completed || 0,
            // Для совместимости со старым интерфейсом
            total_connections: statusStats.total || 0
        };
    } catch (error) {
        throw new Error(`Error fetching service stats: ${error.message}`);
    }
}

// Назначить исполнителей на услугу
export async function assignExecutersToService(serviceId, executerIds) {
    try {
        const service = await Services.findByPk(serviceId);
        if (!service) {
            throw new Error('Услуга не найдена');
        }
        if (!Array.isArray(executerIds)) {
            throw new Error('executerIds должен быть массивом id исполнителей');
        }

        // Получаем текущих назначенных исполнителей ДО изменений
        const currentAccesses = await ServiceAccess.findAll({
            where: { service_id: serviceId },
            include: [
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id', 'status']
                }
            ]
        });

        const currentExecuterIds = currentAccesses.map(a => a.executer_id);
        const newExecuterIds = executerIds;

        // Определяем добавленных и удаленных исполнителей
        const addedExecuterIds = newExecuterIds.filter(id => !currentExecuterIds.includes(id));
        const removedExecuterIds = currentExecuterIds.filter(id => !newExecuterIds.includes(id));

        console.log(`📋 Назначение услуги "${service.name}" (ID: ${serviceId}):`);
        console.log(`➕ Добавляются исполнители: ${addedExecuterIds.join(', ') || 'нет'}`);
        console.log(`➖ Удаляются исполнители: ${removedExecuterIds.join(', ') || 'нет'}`);

        // Выполняем в транзакции
        const t = await sequelize.transaction();
        try {
            // Удаляем старые связи
            await ServiceAccess.destroy({ where: { service_id: serviceId }, transaction: t });

            // Создаем новые связи (если список пуст — просто очистим существующие записи)
            let createdAccesses = [];
            if (executerIds.length > 0) {
                const accessData = executerIds.map(executerId => ({
                    service_id: serviceId,
                    executer_id: executerId,
                    has_access: true,
                    can_replace_materials: false,
                    requires_approval: true,
                    created_at: new Date()
                }));

                createdAccesses = await ServiceAccess.bulkCreate(accessData, { transaction: t });
            }

            // Если назначен ровно один исполнитель — проставим executer_id в таблице services
            if (executerIds.length === 1) {
                await Services.update({ executer_id: executerIds[0] }, { where: { id: serviceId }, transaction: t });
            } else if (executerIds.length === 0) {
                // если список пуст — снимем прямую привязку
                await Services.update({ executer_id: null }, { where: { id: serviceId }, transaction: t });
            }

            // 🔄 НОВОЕ: Создаем записи индивидуальных статусов для всех назначенных исполнителей
            console.log(`📋 Создаю записи статусов для ${executerIds.length} исполнителей`);
            for (const executerId of executerIds) {
                await createOrUpdateExecuterServiceStatus(
                    serviceId,
                    executerId,
                    'inactive',
                    { transaction: t }
                );
            }

            // 🗑️ НОВОЕ: Удаляем записи статусов для исполнителей, которые больше не назначены
            if (removedExecuterIds.length > 0) {
                console.log(`🗑️ Удаляю записи статусов для ${removedExecuterIds.length} исполнителей`);
                await ExecuterServiceStatus.destroy({
                    where: {
                        service_id: serviceId,
                        executer_id: removedExecuterIds
                    },
                    transaction: t
                });
            }

            await t.commit();

            // Подгружаем созданные записи с данными исполнителей для ответа
            const accessesWithExecuters = await ServiceAccess.findAll({
                where: { service_id: serviceId },
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name', 'telegram_id', 'status']
                    }
                ]
            });

            const result = {
                message: 'Исполнители успешно назначены на услугу',
                assigned_executers: accessesWithExecuters.map(a => ({
                    access_id: a.id,
                    executer_id: a.executer_id,
                    executer_name: a.Executer?.name || null,
                    telegram_id: a.Executer?.telegram_id || null,
                    has_access: a.has_access
                }))
            };

            // После успешного назначения отправляем уведомления в бот
            try {
                const fetch = (await import('node-fetch')).default;
                const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

                // Получаем информацию об услуге для уведомления
                const serviceInfo = {
                    id: service.id,
                    name: service.name,
                    category: service.category,
                    price: service.price
                };

                // 1. Уведомляем ДОБАВЛЕННЫХ исполнителей о назначении услуги
                for (const executerId of addedExecuterIds) {
                    const executer = await Executer.findByPk(executerId, {
                        attributes: ['id', 'name', 'telegram_id', 'status']
                    });

                    if (executer?.telegram_id) {
                        try {
                            // Получаем индивидуальную цену для этого исполнителя
                            const serviceAccess = await ServiceAccess.findOne({
                                where: {
                                    service_id: service.id,
                                    executer_id: executerId
                                }
                            });

                            // Используем индивидуальную цену, если она установлена, иначе стандартную
                            const individualPrice = (serviceAccess && serviceAccess.price !== null && serviceAccess.price !== undefined)
                                ? serviceAccess.price
                                : service.price;

                            const serviceInfoForExecuter = {
                                id: service.id,
                                name: service.name,
                                category: service.category,
                                price: individualPrice
                            };

                            const notificationResponse = await fetch(`${API_BASE_URL}/api/executers-bot/notify-service-assigned`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    telegram_id: executer.telegram_id,
                                    executer_name: executer.name || 'Исполнитель',
                                    services: [serviceInfoForExecuter],
                                    admin_name: 'Администратор'
                                })
                            });

                            if (notificationResponse.ok) {
                                console.log(`✅ Уведомление о назначении услуги "${service.name}" отправлено исполнителю ${executer.name} (ID: ${executerId}), цена: ${individualPrice}₽`);
                            } else {
                                console.warn(`⚠️ Не удалось отправить уведомление исполнителю ${executerId}: ${notificationResponse.status}`);
                            }
                        } catch (notifyError) {
                            console.error(`❌ Ошибка отправки уведомления исполнителю ${executerId}:`, notifyError.message);
                        }
                    }
                }

                // 2. Уведомляем УДАЛЕННЫХ исполнителей об отзыве доступа
                for (const removedAccess of currentAccesses) {
                    if (removedExecuterIds.includes(removedAccess.executer_id) && removedAccess.Executer?.telegram_id) {
                        try {
                            // Здесь можно добавить отдельное уведомление об отзыве доступа
                            // Пока просто логируем
                            console.log(`📤 Исполнитель ${removedAccess.Executer.name} (ID: ${removedAccess.executer_id}) больше не имеет доступа к услуге "${service.name}"`);
                        } catch (removeNotifyError) {
                            console.error(`❌ Ошибка обработки отзыва доступа для исполнителя ${removedAccess.executer_id}:`, removeNotifyError.message);
                        }
                    }
                }

            } catch (notifyError) {
                console.error('❌ Ошибка отправки уведомлений в бот:', notifyError.message);
                // Не прерываем процесс назначения исполнителей, если уведомления не отправились
            }

            return result;

        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        throw new Error(`Error assigning executers to service: ${error.message}`);
    }
}

// Получить исполнителей услуги
export async function getServiceExecuters(serviceId) {
    try {
        const serviceAccess = await ServiceAccess.findAll({
            where: { service_id: serviceId },
            include: [
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id', 'rating', 'status', 'balance']
                }
            ]
        });

        return serviceAccess.map(access => ({
            access_id: access.id,
            executer_id: access.executer_id,
            executer_name: access.Executer?.name || `ID: ${access.executer_id}`,
            telegram_id: access.Executer?.telegram_id,
            rating: access.Executer?.rating || 0,
            status: access.Executer?.status || 'inactive',
            balance: access.Executer?.balance || 0,
            has_access: access.has_access,
            can_replace_materials: access.can_replace_materials,
            requires_approval: access.requires_approval,
            assigned_at: access.created_at
        }));
    } catch (error) {
        throw new Error(`Error fetching service executers: ${error.message}`);
    }
}

// Убрать исполнителя с услуги
export async function removeExecuterFromService(serviceId, executerId) {
    try {
        const result = await ServiceAccess.destroy({
            where: {
                service_id: serviceId,
                executer_id: executerId
            }
        });

        if (result === 0) {
            throw new Error('Связь исполнителя с услугой не найдена');
        }

        return { message: 'Исполнитель успешно убран с услуги' };
    } catch (error) {
        throw new Error(`Error removing executer from service: ${error.message}`);
    }
}

// Обновить ценообразование услуги
export async function updateServicePricing(serviceId, basePrice, customPricing = []) {
    try {
        // Обновляем базовую цену услуги
        await Services.update(
            { price: basePrice },
            { where: { id: serviceId } }
        );

        // Удаляем старые индивидуальные цены
        await ExecuterPricing.destroy({
            where: { service_id: serviceId }
        });

        // Добавляем новые индивидуальные цены, если они есть
        if (customPricing && customPricing.length > 0) {
            const pricingData = customPricing.map(pricing => ({
                service_id: serviceId,
                executer_id: pricing.executer_id,
                custom_price: pricing.custom_price
            }));

            await ExecuterPricing.bulkCreate(pricingData);
        }

        return {
            message: 'Ценообразование успешно обновлено',
            base_price: basePrice,
            custom_pricing_count: customPricing.length
        };
    } catch (error) {
        throw new Error(`Error updating service pricing: ${error.message}`);
    }
}

// ==================== УПРАВЛЕНИЕ СТАТУСАМИ ИСПОЛНИТЕЛЕЙ ПО УСЛУГАМ ====================

/**
 * Создает или обновляет статус исполнителя для услуги
 * @param {number} serviceId - ID услуги
 * @param {number} executerId - ID исполнителя
 * @param {string} status - Статус: 'inactive', 'active', 'completed'
 * @param {object} options - Дополнительные опции
 */
export async function createOrUpdateExecuterServiceStatus(serviceId, executerId, status = 'inactive', options = {}) {
    const { transaction } = options;

    try {
        console.log(`🔄 Создаю/обновляю статус услуги ${serviceId} для исполнителя ${executerId}: ${status}`);

        const [statusRecord, created] = await ExecuterServiceStatus.findOrCreate({
            where: {
                service_id: serviceId,
                executer_id: executerId
            },
            defaults: {
                status: status,
                total_orders: status === 'active' || status === 'completed' ? 1 : 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            transaction
        });

        // Если запись уже существует, обновляем статус
        if (!created && statusRecord.status !== status) {
            const updateData = {
                status: status,
                updated_at: new Date()
            };

            // Увеличиваем счетчик заказов при переходе в active или completed
            if ((status === 'active' || status === 'completed') && statusRecord.status === 'inactive') {
                updateData.total_orders = statusRecord.total_orders + 1;
            }

            await statusRecord.update(updateData, { transaction });
            console.log(`✅ Обновлен статус услуги ${serviceId} для исполнителя ${executerId}: ${statusRecord.status} → ${status}`);
        } else if (created) {
            console.log(`✅ Создан новый статус услуги ${serviceId} для исполнителя ${executerId}: ${status}`);
        }

        return statusRecord;
    } catch (error) {
        console.error(`❌ Ошибка создания/обновления статуса услуги:`, error);
        throw error;
    }
}

/**
 * Активирует услугу для исполнителя (переводит в статус 'active')
 * @param {number} serviceId - ID услуги
 * @param {number} executerId - ID исполнителя
 * @param {object} options - Дополнительные опции
 */
export async function activateServiceForExecuter(serviceId, executerId, options = {}) {
    const { transaction } = options;

    try {
        console.log(`🟢 Активирую услугу ${serviceId} для исполнителя ${executerId}`);

        const statusRecord = await createOrUpdateExecuterServiceStatus(
            serviceId,
            executerId,
            'active',
            { transaction }
        );

        console.log(`✅ Услуга ${serviceId} активирована для исполнителя ${executerId}`);
        return statusRecord;
    } catch (error) {
        console.error(`❌ Ошибка активации услуги:`, error);
        throw error;
    }
}

/**
 * Завершает услугу для исполнителя (переводит в статус 'completed')
 * @param {number} serviceId - ID услуги
 * @param {number} executerId - ID исполнителя
 * @param {object} options - Дополнительные опции
 */
export async function completeServiceForExecuter(serviceId, executerId, options = {}) {
    const { transaction } = options;

    try {
        console.log(`🔵 Завершаю услугу ${serviceId} для исполнителя ${executerId}`);

        const statusRecord = await createOrUpdateExecuterServiceStatus(
            serviceId,
            executerId,
            'completed',
            { transaction }
        );

        console.log(`✅ Услуга ${serviceId} завершена для исполнителя ${executerId}`);
        return statusRecord;
    } catch (error) {
        console.error(`❌ Ошибка завершения услуги:`, error);
        throw error;
    }
}

/**
 * Получает статус исполнителя для услуги
 * @param {number} serviceId - ID услуги
 * @param {number} executerId - ID исполнителя
 */
export async function getExecuterServiceStatus(serviceId, executerId) {
    try {
        const statusRecord = await ExecuterServiceStatus.findOne({
            where: {
                service_id: serviceId,
                executer_id: executerId
            },
            include: [
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name']
                },
                {
                    model: Services,
                    as: 'Service',
                    attributes: ['id', 'name']
                }
            ]
        });

        return statusRecord || null;
    } catch (error) {
        console.error(`❌ Ошибка получения статуса услуги:`, error);
        throw error;
    }
}

/**
 * Получает все статусы по услуге
 * @param {number} serviceId - ID услуги
 */
export async function getServiceExecuterStatuses(serviceId) {
    try {
        const statusRecords = await ExecuterServiceStatus.findAll({
            where: { service_id: serviceId },
            include: [
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name', 'telegram_id']
                }
            ],
            order: [['updated_at', 'DESC']]
        });

        return statusRecords;
    } catch (error) {
        console.error(`❌ Ошибка получения статусов исполнителей услуги:`, error);
        throw error;
    }
}

/**
 * Получает статистику по статусам услуг
 */
export async function getServiceStatusesStats() {
    try {
        const stats = await ExecuterServiceStatus.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const result = {
            total: 0,
            inactive: 0,
            active: 0,
            completed: 0
        };

        stats.forEach(stat => {
            result[stat.status] = parseInt(stat.count) || 0;
            result.total += parseInt(stat.count) || 0;
        });

        return result;
    } catch (error) {
        console.error(`❌ Ошибка получения статистики статусов:`, error);
        throw error;
    }
}