import { Material, Services, MaterialReplacement, Order, Executer, ServiceExecution } from "../../../database/dbTables.js";
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Sequelize } from 'sequelize';

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
            order: [['create_date_material', 'DESC']]
        });

        // Для каждого материала находим связанные заказы
        const materialsWithOrders = await Promise.all(
            materials.map(async (material) => {
                const materialData = material.toJSON();

                // Ищем ServiceExecution с тем же service_id, которые используют этот материал
                if (material.status === 'used' && material.service_id) {
                    const serviceExecution = await ServiceExecution.findOne({
                        where: {
                            service_id: material.service_id,
                            material_contents: material.contents
                        },
                        attributes: ['order_number'],
                        order: [['created_at', 'DESC']]
                    });

                    if (serviceExecution) {
                        materialData.order_number = serviceExecution.order_number;
                    }
                }

                return materialData;
            })
        );

        return materialsWithOrders;
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
        const { type_key = 'key', contents, source = 'manual', service_id, status = 'available' } = data;

        if (!contents || !service_id) {
            throw new Error('Contents and service ID are required');
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

export async function updateMaterialStatus(id, status) {
    try {
        const material = await Material.findByPk(id);
        if (!material) {
            throw new Error('Material not found');
        }

        const updateData = { status };

        // Если статус меняется на "pending_replace", устанавливаем дату запроса замены
        if (status === 'pending_replace') {
            updateData.replacement_requested_date = new Date();
        }

        // Если статус меняется на "used", устанавливаем дату использования
        if (status === 'used') {
            updateData.used_date = new Date();
        }

        const updatedMaterial = await material.update(updateData);
        return updatedMaterial;
    } catch (error) {
        throw new Error(`Error updating material status: ${error.message}`);
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
        const pending_replace = await Material.count({ where: { status: 'pending_replace' } });

        return {
            total,
            available,
            used,
            pending_replace
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
                    as: 'Service',
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

// Загрузить материалы из файла
export async function uploadMaterialsFromFile(file, serviceId) {
    try {
        // Проверяем существование услуги
        const service = await Services.findByPk(serviceId);
        if (!service) {
            throw new Error('Услуга не найдена');
        }

        const filePath = file.path;
        const fileName = file.originalname.toLowerCase();
        const materials = [];

        if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
            // Обработка CSV/TXT файлов
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                const content = line.trim();
                if (content) {
                    materials.push({
                        service_id: serviceId,
                        contents: content,
                        status: 'available',
                        source: 'file_upload',
                        added_date: new Date()
                    });
                }
            }
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Обработка Excel файлов
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            for (const row of data) {
                if (row[0] && typeof row[0] === 'string') {
                    const content = row[0].trim();
                    if (content) {
                        materials.push({
                            service_id: serviceId,
                            contents: content,
                            status: 'available',
                            source: 'file_upload',
                            added_date: new Date()
                        });
                    }
                }
            }
        } else {
            throw new Error('Неподдерживаемый формат файла. Используйте .csv, .txt, .xlsx или .xls');
        }

        // Сохраняем материалы в базу данных
        if (materials.length > 0) {
            await Material.bulkCreate(materials);
        }

        // Удаляем временный файл
        fs.unlinkSync(filePath);

        return {
            success: true,
            count: materials.length,
            message: `Загружено ${materials.length} материалов`
        };
    } catch (error) {
        // Удаляем временный файл в случае ошибки
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new Error(`Error uploading materials: ${error.message}`);
    }
}

// Добавить один материал вручную
export async function addSingleMaterial(serviceId, contents, typeKey = null) {
    try {
        // Проверяем существование услуги
        const service = await Services.findByPk(serviceId);
        if (!service) {
            throw new Error('Услуга не найдена');
        }

        const materialData = {
            service_id: serviceId,
            contents: contents.trim(),
            status: 'available',
            source: 'manual_input',
            added_date: new Date()
        };

        // Добавляем type_key только если он указан
        if (typeKey) {
            materialData.type_key = typeKey;
        }

        const material = await Material.create(materialData);

        return {
            success: true,
            material,
            message: 'Материал добавлен'
        };
    } catch (error) {
        throw new Error(`Error adding material: ${error.message}`);
    }
}

// Получить статистику материалов по конкретной услуге
export async function getMaterialStatsByService(serviceId) {
    try {
        // Проверяем существование услуги
        const service = await Services.findByPk(serviceId);
        if (!service) {
            throw new Error('Услуга не найдена');
        }

        const total = await Material.count({ where: { service_id: serviceId } });
        const available = await Material.count({
            where: {
                service_id: serviceId,
                status: 'available'
            }
        });
        const used = await Material.count({
            where: {
                service_id: serviceId,
                status: 'used'
            }
        });
        const pending_replace = await Material.count({
            where: {
                service_id: serviceId,
                status: 'pending_replace'
            }
        });

        // Статистика по источникам
        const sourceStats = await Material.findAll({
            where: { service_id: serviceId },
            attributes: [
                'source',
                [Material.sequelize.fn('COUNT', Material.sequelize.col('id')), 'count']
            ],
            group: ['source'],
            raw: true
        });

        // Статистика по типам ключей
        const typeStats = await Material.findAll({
            where: { service_id: serviceId },
            attributes: [
                'type_key',
                [Material.sequelize.fn('COUNT', Material.sequelize.col('id')), 'count']
            ],
            group: ['type_key'],
            raw: true
        });

        return {
            service: {
                id: service.id,
                name: service.name,
                category: service.category
            },
            stats: {
                total,
                available,
                used,
                pending_replace,
                unused: available + pending_replace
            },
            sourceBreakdown: sourceStats,
            typeBreakdown: typeStats
        };
    } catch (error) {
        throw new Error(`Error fetching material stats by service: ${error.message}`);
    }
}
