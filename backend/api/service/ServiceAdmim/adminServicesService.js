import { Services, Material, ExecuterPricing, Executer } from "../../../database/dbTables.js";


export async function getAllServices() {
    try {
        const services = await Services.findAll({
            order: [['createdAt', 'DESC']]
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

            result.push({
                ...service.dataValues,
                source: sources.join(', ') || '-',
                available_keys: availableKeys,
                custom_pricing: customPricing.map(pricing => ({
                    executer_id: pricing.executer_id,
                    executer_name: pricing.Executer?.name || `Исполнитель ${pricing.executer_id}`,
                    custom_price: pricing.custom_price
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
        const { name, category, price, status } = data;

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