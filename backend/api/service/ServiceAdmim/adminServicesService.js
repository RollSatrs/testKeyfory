import { Services, Material } from "../../../database/dbTables.js";


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

            result.push({
                ...service.dataValues,
                source: sources.join(', ') || '-',
                available_keys: availableKeys
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
        const { name, category, required_keys, price, status } = data;

        if (!name || !category) {
            throw new Error('Name and category are required');
        }
        if (price === undefined) throw new Error('price is not defined');

        const newService = await Services.create({
            name,
            category,
            price,
            required_keys: required_keys || 0,
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