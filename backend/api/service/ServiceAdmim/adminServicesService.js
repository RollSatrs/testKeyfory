import { Services, Material, ExecuterPricing, Executer, ServiceAccess, ServiceExecution, Admin } from "../../../database/dbTables.js";
import { sequelize } from "../../../database/databaseOn.js";
import { Op } from 'sequelize';


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

            // Считаем доступные ключи (материалы со статусом не "used")
            const availableKeys = materials.filter(m =>
                m.status !== 'used' && m.status !== 'ИСПОЛЬЗОВАН'
            ).length;

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
            const activeOrders = await ServiceExecution.findAll({
                where: {
                    service_id: service.id,
                    status: ['in_progress', 'active', 'pending_approval']
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
                where: { service_id: service.id, status: 'completed' },
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

            // From ServiceExecution rows first (preserve order)
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
            for (const m of materials) {
                if (m.order_number) {
                    const num = m.order_number;
                    if (!ordersMap.has(num)) {
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
    const { name, category, price, status, loading_method, executer_id } = data;

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

        // Ensure newly created services are active by default so executers see them in the bot
        const svcStatus = (typeof status === 'string' && status.trim() !== '') ? status : 'active';

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
        const total = await Services.count();
        const active = await Services.count({ where: { status: 'active' } });
        const inactive = await Services.count({ where: { status: 'inactive' } });

        return {
            total,
            active,
            inactive
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

            return {
                message: 'Исполнители успешно назначены на услугу',
                assigned_executers: accessesWithExecuters.map(a => ({
                    access_id: a.id,
                    executer_id: a.executer_id,
                    executer_name: a.Executer?.name || null,
                    telegram_id: a.Executer?.telegram_id || null,
                    has_access: a.has_access
                }))
            };
        } catch (txErr) {
            await t.rollback();
            throw txErr;
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