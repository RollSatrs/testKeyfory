import { Material, Services, MaterialReplacement, Order, Executer } from "../../../database/dbTables.js";

export async function getAllMaterials() {
    try {
        const materials = await Material.findAll({
            include: [
                {
                    model: Services,
                    as: 'Service',
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
                    as: 'Service',
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

// Получить все запросы на замену материалов
export async function getAllReplacementRequests() {
    try {
        const requests = await MaterialReplacement.findAll({
            include: [
                {
                    model: Order,
                    attributes: ['id', 'total_sum', 'status'],
                    include: [
                        {
                            model: Services,
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return requests;
    } catch (error) {
        throw new Error(`Error fetching replacement requests: ${error.message}`);
    }
}

// Получить запросы на замену материалов с определенным статусом
export async function getReplacementRequestsByStatus(status = 'pending') {
    try {
        const requests = await MaterialReplacement.findAll({
            where: { status },
            include: [
                {
                    model: Order,
                    attributes: ['id', 'total_sum', 'status'],
                    include: [
                        {
                            model: Services,
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return requests;
    } catch (error) {
        throw new Error(`Error fetching replacement requests by status: ${error.message}`);
    }
}

// Обработать запрос на замену материала
export async function processReplacementRequest(requestId, adminId, decision, adminResponse = null) {
    try {
        const request = await MaterialReplacement.findByPk(requestId);

        if (!request) {
            throw new Error('Запрос на замену не найден');
        }

        if (request.status !== 'pending') {
            throw new Error('Запрос уже обработан');
        }

        await request.update({
            status: decision, // 'approved' или 'rejected'
            admin_response: adminResponse,
            processed_by: adminId,
            processed_at: new Date()
        });

        return request;
    } catch (error) {
        throw new Error(`Error processing replacement request: ${error.message}`);
    }
}
