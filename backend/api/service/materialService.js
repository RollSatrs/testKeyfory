import { Material, Services } from "../../database/dbTables.js";

export async function getAllMaterials() {
    try {
        const materials = await Material.findAll({
            include: [
                {
                    model: Services,
                    as: 'Service', // Изменили на 'Service' с большой буквы
                    attributes: ['name', 'category']
                }
            ],
            order: [['create_date_material', 'DESC']]
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
                    as: 'Service', // Изменили на 'Service' с большой буквы
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
        const { type_key, contents, source = 'manual', service_id, status = 'available' } = data;

        if (!type_key || !contents || !service_id) {
            throw new Error('Type key, contents and service ID are required');
        }

        // Проверяем существование услуги
        const service = await Services.findByPk(service_id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Проверяем количество доступных ключей для этой услуги
        const availableKeys = await Material.count({
            where: {
                service_id: service_id,
                status: ['available', 'reserved'] // учитываем доступные и зарезервированные
            }
        });

        const requiredKeys = service.required_keys || 0;

        // Если доступных ключей уже достаточно, не добавляем новый
        if (availableKeys >= requiredKeys) {
            throw new Error(`Для услуги "${service.name}" уже достаточно ключей (${availableKeys}/${requiredKeys}). Добавление нового ключа не требуется.`);
        }

        const newMaterial = await Material.create({
            type_key,
            contents,
            source,
            service_id,
            status,
            added_date: new Date()
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
                    as: 'Service', // Изменили на 'Service' с большой буквы
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
