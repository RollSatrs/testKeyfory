import { Material, Services } from "../../database/dbTables.js";

export async function getAllMaterials() {
    try {
        const materials = await Material.findAll({
            include: [
                {
                    model: Services,
                    as: 'service',
                    attributes: ['name', 'category']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return materials;
    } catch (error) {
        throw new Error(`Error fetching materials: ${error.message}`);
    }
}

export async function getMaterialById(id) {
    try {
        const material = await Material.findByPk(id, {
            include: [
                {
                    model: Services,
                    as: 'service',
                    attributes: ['name', 'category']
                }
            ]
        });
        if (!material) {
            throw new Error('Material not found');
        }
        return material;
    } catch (error) {
        throw new Error(`Error fetching material: ${error.message}`);
    }
}

export async function addMaterial(data) {
    try {
        const { key_data, source, service_id, status = 'available' } = data;

        if (!key_data || !source || !service_id) {
            throw new Error('Key data, source and service ID are required');
        }

        // Проверяем существование услуги
        const service = await Services.findByPk(service_id);
        if (!service) {
            throw new Error('Service not found');
        }

        const newMaterial = await Material.create({
            key_data,
            source,
            service_id,
            status
        });
        return newMaterial;
    } catch (error) {
        throw new Error(`Error creating material: ${error.message}`);
    }
}

export async function updateMaterial(id, data) {
    try {
        const material = await Material.findByPk(id);
        if (!material) {
            throw new Error('Material not found');
        }

        const updatedMaterial = await material.update(data);
        return updatedMaterial;
    } catch (error) {
        throw new Error(`Error updating material: ${error.message}`);
    }
}

export async function deleteMaterial(id) {
    try {
        const material = await Material.findByPk(id);
        if (!material) {
            throw new Error('Material not found');
        }

        await material.destroy();
        return { message: 'Material deleted successfully' };
    } catch (error) {
        throw new Error(`Error deleting material: ${error.message}`);
    }
}

export async function getMaterialStats() {
    try {
        const total = await Material.count();
        const available = await Material.count({ where: { status: 'available' } });
        const used = await Material.count({ where: { status: 'used' } });
        const reserved = await Material.count({ where: { status: 'reserved' } });

        return {
            total,
            available,
            used,
            reserved
        };
    } catch (error) {
        throw new Error(`Error fetching material stats: ${error.message}`);
    }
}

export async function getMaterialsByService(serviceId) {
    try {
        const materials = await Material.findAll({
            where: { service_id: serviceId },
            include: [
                {
                    model: Services,
                    as: 'service',
                    attributes: ['name', 'category']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return materials;
    } catch (error) {
        throw new Error(`Error fetching materials by service: ${error.message}`);
    }
}
