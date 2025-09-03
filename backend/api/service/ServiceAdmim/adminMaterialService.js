import { Material, Services, MaterialReplacement, Order, Executer, ServiceExecution, ServiceAccess } from "../../../database/dbTables.js";
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Sequelize, Op } from 'sequelize';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

export async function getAllMaterials() {
    try {
        const materials = await Material.findAll({
            include: [
                {
                    model: Services,
                    as: 'Service',
                    attributes: ['name', 'category']
                },
                {
                    model: Executer,
                    as: 'Executer',
                    attributes: ['id', 'name', 'telegram_id'],
                    required: false
                }
            ],
            order: [['create_date_material', 'DESC']]
        });

        // Для каждого материала находим все связанные заказы с исполнителями
        const materialsWithOrders = await Promise.all(
            materials.map(async (material) => {
                const materialData = material.toJSON();

                // Ищем все ServiceExecution для данного материала и услуги
                const serviceExecutions = await ServiceExecution.findAll({
                    where: {
                        service_id: material.service_id,
                        status: ['active', 'in_progress', 'pending'] // Активные заказы
                    },
                    include: [{
                        model: Executer,
                        as: 'Executer',
                        attributes: ['id', 'name', 'telegram_id']
                    }],
                    attributes: ['order_number', 'executer_id', 'status']
                });

                // Также ищем назначенные материалы через MaterialAssignment (если есть такая таблица)
                // или используем order_number из материала
                const relatedOrders = [];

                // Если у материала есть order_number, добавляем его
                if (material.order_number) {
                    const directExecution = serviceExecutions.find(se => se.order_number === material.order_number);
                    if (directExecution && directExecution.Executer) {
                        relatedOrders.push({
                            order_number: directExecution.order_number,
                            executer_name: directExecution.Executer.name,
                            executer_id: directExecution.executer_id,
                            status: directExecution.status
                        });
                    } else {
                        // If material already carries order_number (set during assignment), prefer that value
                        // and also propagate executer_name if present on the material row.
                        relatedOrders.push({
                            order_number: material.order_number,
                            executer_name: material.executer_name || 'Неизвестный исполнитель',
                            executer_id: material.executer_id || null,
                            status: material.status || MATERIAL_STATUS.USED
                        });
                    }
                }

                // УБИРАЕМ НЕКОРРЕКТНУЮ ЛОГИКУ: НЕ привязываем все активные заказы к доступным материалам
                // Материал должен показывать заказ только если он реально назначен на этот заказ

                // Do not attach active_orders to material response (UI wants single-row materials)
                if (relatedOrders.length > 0) {
                    // For backward compatibility still populate first-order quick fields
                    materialData.executer_name = relatedOrders[0].executer_name;
                    materialData.executer_id = relatedOrders[0].executer_id;
                    materialData.order_number = relatedOrders[0].order_number;
                } else if (material.order_number) {
                    // If material has order_number but no related active ServiceExecution was found,
                    // still expose the order_number and executor info from the material row.
                    materialData.order_number = material.order_number;
                    materialData.executer_name = material.executer_name || 'Неизвестный исполнитель';
                } else {
                    // ДЛЯ РАСХОДНЫХ МАТЕРИАЛОВ: НЕ автоматически подтягиваем исполнителя
                    // Исполнитель должен назначаться только при фактическом использовании материала через бот

                    // Проверяем, является ли услуга расходной
                    const service = await Services.findByPk(material.service_id);
                    const isConsumableService = service && service.is_consumable;

                    if (!isConsumableService) {
                        // Для НЕ расходных материалов - оставляем старую логику подтягивания исполнителя
                        try {
                            // 1) Если у услуги назначен исполнитель напрямую (Services.executer_id)
                            const serviceWithExecuter = await Services.findByPk(material.service_id, {
                                include: [{ model: Executer, as: 'assignedExecuter', attributes: ['id', 'name'] }]
                            });

                            if (serviceWithExecuter && serviceWithExecuter.assignedExecuter) {
                                materialData.executer_name = serviceWithExecuter.assignedExecuter.name;
                                materialData.executer_id = serviceWithExecuter.assignedExecuter.id;
                            } else {
                                // 2) Ищем права доступа ServiceAccess и подтягиваем первого доступного исполнителя
                                const accessList = await ServiceAccess.findAll({
                                    where: { service_id: material.service_id, has_access: true },
                                    include: [{ model: Executer, attributes: ['id', 'name'] }],
                                    limit: 1
                                });
                                if (accessList && accessList.length > 0 && accessList[0].Executer) {
                                    materialData.executer_name = accessList[0].Executer.name;
                                    materialData.executer_id = accessList[0].Executer.id;
                                }
                            }
                        } catch (err) {
                            // Не критично — просто не заполняем поле исполнителя
                            // console.warn('Ошибка при попытке получить исполнителя для материала', err.message);
                        }
                    }
                    // Для расходных материалов оставляем executer_name и executer_id пустыми
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
        const { type_key = 'key', contents, source = 'manual', service_id, status = MATERIAL_STATUS.AVAILABLE } = data;

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
        const material = await Material.findByPk(id, {
            include: [
                {
                    model: Services,
                    as: 'Service'
                }
            ]
        });

        if (!material) {
            throw new Error('Material not found');
        }

        // Сохраняем старые данные для сравнения
        const oldContents = material.contents;
        const oldStatus = material.status;

        // Обрабатываем service_ids (массив) и преобразуем в service_id (одиночное значение)
        if (data.service_ids && Array.isArray(data.service_ids)) {
            // Пока что берем первую услугу из массива, в будущем можно расширить до множественных связей
            if (data.service_ids.length > 0) {
                data.service_id = data.service_ids[0];
            }
            delete data.service_ids; // Удаляем service_ids из данных для обновления
        }

        // Если передан executer_id, получаем имя исполнителя
        if (data.executer_id) {
            const { Executer } = await import('../../../database/dbTables.js');
            const executer = await Executer.findByPk(data.executer_id);
            if (executer) {
                data.executer_name = executer.name;
            }
        } else if (data.executer_id === null) {
            // Если executer_id устанавливается в null, очищаем и executer_name
            data.executer_name = null;
        }

        const updatedMaterial = await material.update(data);

        // Проверяем, изменились ли значимые поля материала
        const hasSignificantChanges =
            (data.contents && data.contents !== oldContents) ||
            (data.status && data.status !== oldStatus);

        if (hasSignificantChanges) {
            // Отправляем уведомления исполнителям, связанным с этим материалом
            await sendMaterialEditNotifications(updatedMaterial);
        }

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
        if (status === MATERIAL_STATUS.USED) {
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
        const available = await Material.count({ where: { status: MATERIAL_STATUS.AVAILABLE } });
        const used = await Material.count({ where: { status: MATERIAL_STATUS.USED } });
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
                        status: MATERIAL_STATUS.AVAILABLE,
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
                            status: MATERIAL_STATUS.AVAILABLE,
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
            status: MATERIAL_STATUS.AVAILABLE,
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
                status: MATERIAL_STATUS.AVAILABLE
            }
        });
        const used = await Material.count({
            where: {
                service_id: serviceId,
                status: MATERIAL_STATUS.USED
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

// Функция отправки уведомлений исполнителям о редактировании материала
async function sendMaterialEditNotifications(material) {
    try {
        const { ServiceExecution, Executer, Services } = await import('../../../database/dbTables.js');

        // Получаем исполнителей, которые связаны с этим материалом
        let executersToNotify = new Set();

        // 1. Исполнитель, непосредственно назначенный на материал
        if (material.executer_id) {
            executersToNotify.add(material.executer_id);
        }

        // 2. Исполнители, у которых есть активные заказы с этим материалом
        if (material.order_number) {
            const executions = await ServiceExecution.findAll({
                where: {
                    order_number: material.order_number,
                    status: {
                        [Op.in]: ['pending', 'in_progress']
                    }
                },
                include: [
                    {
                        model: Executer,
                        as: 'Executer'
                    }
                ]
            });

            executions.forEach(execution => {
                if (execution.Executer) {
                    executersToNotify.add(execution.Executer.id);
                }
            });
        }

        // 3. Исполнители, назначенные на услугу этого материала
        if (material.service_id) {
            const { ServiceAccess } = await import('../../../database/dbTables.js');
            const serviceAccesses = await ServiceAccess.findAll({
                where: {
                    service_id: material.service_id
                },
                include: [
                    {
                        model: Executer,
                        as: 'Executer'
                    }
                ]
            });

            serviceAccesses.forEach(access => {
                if (access.Executer) {
                    executersToNotify.add(access.Executer.id);
                }
            });
        }

        // Получаем информацию об услуге для уведомления
        let serviceName = 'Неизвестная услуга';
        if (material.service_id) {
            const service = await Services.findByPk(material.service_id);
            if (service) {
                serviceName = service.name;
            }
        }

        // Отправляем уведомления каждому исполнителю
        const notificationPromises = Array.from(executersToNotify).map(async (executerId) => {
            try {
                const executer = await Executer.findByPk(executerId);
                if (!executer || !executer.telegram_id) {
                    console.warn(`Исполнитель ${executerId} не найден или у него нет telegram_id`);
                    return;
                }

                // Подготавливаем информацию о материале
                const materialInfo = {
                    serviceName: serviceName,
                    contents: material.contents || 'Не указано',
                    status: material.status || 'Не указан',
                    orderNumber: material.order_number || null
                };

                // Отправляем POST запрос к боту
                const response = await fetch('http://localhost:3000/api/executers-bot/notify-material-edited', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telegram_id: executer.telegram_id,
                        executer_name: executer.name || `Исполнитель ${executer.id}`,
                        material_info: materialInfo,
                        admin_name: 'Администратор'
                    })
                });

                if (response.ok) {
                    console.log(`✅ Уведомление о редактировании материала отправлено исполнителю ${executer.name} (${executer.telegram_id})`);
                } else {
                    console.warn(`⚠️ Не удалось отправить уведомление исполнителю ${executer.name}: ${response.status}`);
                }

            } catch (error) {
                console.error(`❌ Ошибка отправки уведомления исполнителю ${executerId}:`, error.message);
            }
        });

        // Ждем завершения всех уведомлений (не блокируем основной процесс в случае ошибки)
        await Promise.allSettled(notificationPromises);

        console.log(`📝 Отправлены уведомления о редактировании материала ${executersToNotify.size} исполнителям`);

    } catch (error) {
        console.error('❌ Ошибка отправки уведомлений о редактировании материала:', error.message);
    }
}
