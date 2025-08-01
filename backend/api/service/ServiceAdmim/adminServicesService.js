import { Services, Material, ExecuterPricing, Executer, ServiceAccess, ServiceExecution } from "../../../database/dbTables.js";


export async function getAllServices() {
    try {
        const services = await Services.findAll({
            include: [
                {
                    model: Executer,
                    as: 'assignedExecuter',
                    attributes: ['id', 'name', 'telegram_id', 'status'],
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

            // Получаем последний активный заказ для услуги
            const latestOrder = await ServiceExecution.findOne({
                where: { service_id: service.id },
                attributes: ['order_number', 'status'],
                order: [['created_at', 'DESC']]
            });

            result.push({
                ...service.dataValues,
                source: sources.join(', ') || '-',
                available_keys: availableKeys,
                order_number: latestOrder?.order_number || null,
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

        const newService = await Services.create({
            name,
            category,
            price: validPrice,
            status,
            loading_method: loading_method || 'manual',
            executer_id: executer_id || null,
            admin_id: 1
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

export async function deleteService(id) {
    try {
        const service = await Services.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        await service.destroy();
        return { message: 'Service deleted successfully' };
    } catch (error) {
        throw new Error(`Error deleting service: ${error.message}`);
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

        // Удаляем старые связи
        await ServiceAccess.destroy({ where: { service_id: serviceId } });

        // Создаем новые связи
        const accessPromises = executerIds.map(executerId =>
            ServiceAccess.create({
                service_id: serviceId,
                executer_id: executerId,
                has_access: true,
                can_replace_materials: false,
                requires_approval: true
            })
        );

        await Promise.all(accessPromises);

        return { message: 'Исполнители успешно назначены на услугу' };
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