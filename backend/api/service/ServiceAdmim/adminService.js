import { Admin, MaterialReplacement, Order, Services, Executer, Material, ServiceExecution } from "../../../database/dbTables.js";
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

export async function addAdmin(telegramId, passwordHash) {
    try{
        if(!telegramId || !passwordHash) throw new Error('Не указан telegram_id или password_hash')

        await Admin.create({ telegramId, password: passwordHash})
        console.log(`✅ Админ создан: ${telegramId}`)
        return
    }catch(err){
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error('Админ с таким Telegram ID уже существует');
        }
        throw new Error('Ошибка сервера')
    }
}

export async function checkAdmin(telegramId) {
    try{
        if(!telegramId) throw new Error('Не указан telegram_id')

        const admin = await Admin.findOne({ where: { telegramId } });
        if (!admin) {
            console.log(`❌ Админ не найден: ${telegramId}`);
            throw new Error('Админ не найден');
        }

        console.log('✅ Админ найден:', admin.telegramId);
        return admin;
    }catch(err){
        if (err.message === 'Админ не найден') {
            throw err;
        }
        throw new Error('Ошибка сервера')
    }
}

export async function login(telegramId, password) {
    try{
        if(!telegramId || !password) throw new Error('Не указан telegram_id или password')

        const admin = await Admin.findOne({ where: { telegramId } });
        if (!admin) throw new Error('Нет такого админа');

        const valid = await bcrypt.compare(password, admin.password)
        if (!valid) throw new Error('Неверный пароль');

        console.log(`✅ Успешный вход для админа: ${telegramId}`);
        return admin;
    }catch(err){
        if (err.message === 'Нет такого админа' || err.message === 'Неверный пароль') {
            throw err;
        }
        throw new Error('Ошибка сервера')
    }
}

// Получить все заявки на замену материалов
export async function getAllMaterialReplacements() {
    try {
        const replacements = await MaterialReplacement.findAll({
            // Убираем фильтр по статусу, чтобы показывать все заявки
            include: [
                {
                    model: ServiceExecution,
                    as: 'ServiceExecution',
                    attributes: ['id', 'order_number', 'service_id'],
                    include: [
                        {
                            model: Services,
                            as: 'Service',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id']
                },
                {
                    model: Material,
                    attributes: ['type_key', 'contents'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return replacements;
    } catch (err) {
        console.error('Ошибка при получении заявок на замену:', err);
        throw new Error('Ошибка сервера');
    }
}

// Обновить статус заявки на замену
export async function updateReplacementStatus(replacementId, status, adminComment = null) {
    try {
        const validStatuses = ['pending', 'approved', 'rejected', 'completed'];

        if (!validStatuses.includes(status)) {
            throw new Error('Недопустимый статус');
        }

        const replacement = await MaterialReplacement.findByPk(replacementId, {
            include: [
                {
                    model: Material,
                    attributes: ['id']
                }
            ]
        });

        if (!replacement) {
            throw new Error('Заявка на замену не найдена');
        }

        // Если заявка одобрена
        if (status === 'approved') {
            // Меняем статус материала на "доступный"
            if (replacement.material_id) {
                await Material.update(
                    { status: MATERIAL_STATUS.AVAILABLE },
                    { where: { id: replacement.material_id } }
                );
            }

            // Обновляем заявку и помечаем как завершенную
            await replacement.update({
                status: 'completed',
                admin_response: adminComment || replacement.admin_response,
                processed_at: new Date()
            });
        } else if (status === 'rejected') {
            // Если отклонена, возвращаем материал в исходное состояние
            if (replacement.material_id) {
                await Material.update(
                    { status: MATERIAL_STATUS.AVAILABLE },
                    { where: { id: replacement.material_id } }
                );
            }

            await replacement.update({
                status: status,
                admin_response: adminComment || replacement.admin_response,
                processed_at: new Date()
            });
        } else {
            await replacement.update({
                status: status,
                admin_response: adminComment || replacement.admin_response
            });
        }

        return replacement;
    } catch (err) {
        console.error('Ошибка при обновлении статуса заявки:', err);
        throw new Error(err.message || 'Ошибка сервера');
    }
}

// Обработать замену материала с выбором нового материала
export async function processReplacementWithNewMaterial(replacementId, newMaterialId, adminComment = null) {
    try {
        const replacement = await MaterialReplacement.findByPk(replacementId, {
            include: [
                {
                    model: ServiceExecution,
                    as: 'ServiceExecution',
                    attributes: ['id', 'service_id', 'order_number'],
                    include: [
                        {
                            model: Services,
                            as: 'Service',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Executer,
                    attributes: ['id', 'name', 'telegram_id']
                },
                {
                    model: Material,
                    attributes: ['id', 'type_key', 'contents']
                }
            ]
        });

        if (!replacement) {
            throw new Error('Заявка на замену не найдена');
        }

        // Проверяем новый материал
        const newMaterial = await Material.findByPk(newMaterialId);
        if (!newMaterial) {
            throw new Error('Новый материал не найден');
        }

        if (newMaterial.status !== MATERIAL_STATUS.AVAILABLE) {
            throw new Error('Выбранный материал недоступен');
        }

        // Получаем информацию о старом материале для переноса данных
        let oldMaterialData = null;
        if (replacement.material_id) {
            oldMaterialData = await Material.findByPk(replacement.material_id);
        }

        // Выполняем замену в транзакции для целостности данных
        const { sequelize } = await import('../../../database/databaseOn.js');

        await sequelize.transaction(async (t) => {
            if (replacement.material_id && oldMaterialData) {
                // Старый материал получает статус "заменен" и убираем все привязки
                await Material.update(
                    {
                        status: MATERIAL_STATUS.REPLACED,
                        order_number: null,
                        executer_id: null,
                        used_date: null // Обнуляем дату использования
                    },
                    {
                        where: { id: replacement.material_id },
                        transaction: t
                    }
                );

                console.log(`🔄 Старый материал ID ${replacement.material_id} помечен как заменен`);

                // Новый материал получает все данные от старого и становится использованным
                await Material.update(
                    {
                        status: MATERIAL_STATUS.USED,
                        order_number: oldMaterialData.order_number,
                        executer_id: oldMaterialData.executer_id,
                        used_date: new Date()
                    },
                    {
                        where: { id: newMaterialId },
                        transaction: t
                    }
                );

                console.log(`✅ Новый материал ID ${newMaterialId} назначен исполнителю ${oldMaterialData.executer_id} на заказ ${oldMaterialData.order_number}`);
            } else {
                // Если нет старого материала, просто назначаем новый
                await Material.update(
                    {
                        status: MATERIAL_STATUS.USED,
                        order_number: replacement.ServiceExecution?.order_number || null,
                        executer_id: replacement.executer_id,
                        used_date: new Date()
                    },
                    {
                        where: { id: newMaterialId },
                        transaction: t
                    }
                );

                console.log(`✅ Новый материал ID ${newMaterialId} назначен исполнителю ${replacement.executer_id}`);
            }
        });

        // Формируем описание нового материала
        const newMaterialDescription = newMaterial.type_key
            ? `${newMaterial.type_key} - ${newMaterial.contents}`
            : newMaterial.contents || 'Новый материал';

        // Обновляем заявку
        await replacement.update({
            status: 'completed',
            admin_response: adminComment || `Материал заменен. Новый материал: ${newMaterialDescription}`,
            processed_at: new Date()
        });

        // Отправляем уведомление исполнителю через бот
        try {
            // Динамический импорт функции уведомления из бота
            const botModule = await import('../../../../bot/executerBot.js');

            if (botModule.notifyMaterialReplacement) {
                // Получаем актуальные данные нового материала после обновления
                const updatedNewMaterial = await Material.findByPk(newMaterialId, {
                    attributes: ['id', 'type_key', 'contents', 'status', 'order_number', 'executer_id']
                });

                // Получаем актуальные данные старого материала после обновления статуса
                let oldMaterialDescription = null;
                if (replacement.material_id) {
                    const updatedOldMaterial = await Material.findByPk(replacement.material_id, {
                        attributes: ['id', 'type_key', 'contents', 'status']
                    });

                    if (updatedOldMaterial) {
                        oldMaterialDescription = updatedOldMaterial.contents || 'Старый материал';
                        console.log(`📦 Старый материал для уведомления: ${oldMaterialDescription} (статус: ${updatedOldMaterial.status})`);
                    }
                }

                // Используем актуальные данные нового материала
                const newMaterialDescription = updatedNewMaterial?.contents || 'Новый материал';

                console.log(`📦 Новый материал для уведомления: ${newMaterialDescription} (статус: ${updatedNewMaterial?.status})`);
                console.log(`👤 Назначен исполнителю: ${updatedNewMaterial?.executer_id}, заказ: ${updatedNewMaterial?.order_number}`);

                // Отправляем уведомление с дополнительной защитой от ошибок
                const notificationResult = await botModule.notifyMaterialReplacement({
                    telegramId: replacement.Executer.telegram_id,
                    orderNumber: replacement.ServiceExecution.order_number,
                    serviceName: replacement.ServiceExecution.Service.name,
                    oldMaterial: oldMaterialDescription,
                    newMaterial: newMaterialDescription,
                    adminComment: adminComment
                });

                if (notificationResult) {
                    console.log(`✅ Уведомление о замене материала отправлено исполнителю ${replacement.Executer.telegram_id}`);
                } else {
                    console.log(`⚠️ Уведомление не удалось отправить, но замена выполнена успешно`);
                }
            } else {
                console.log(`⚠️ Функция уведомления не найдена в боте`);
            }
        } catch (notifyError) {
            console.error('❌ Ошибка отправки уведомления (не критичная):', notifyError.message || notifyError);
            // Логируем детали для отладки, но не прерываем выполнение
            console.log(`📨 Не удалось отправить уведомление исполнителю ${replacement.Executer.telegram_id}`);
            console.log(`📋 Заказ: #${replacement.ServiceExecution.order_number}`);
            console.log(`🎯 Услуга: ${replacement.ServiceExecution.Service.name}`);
            console.log(`❌ Старый материал: ${replacement.Material ? replacement.Material.contents : 'Не указан'}`);
            console.log(`✅ Новый материал: ${newMaterial.contents}`);
            if (adminComment) {
                console.log(`💬 Комментарий: ${adminComment}`);
            }
            // Не бросаем ошибку, чтобы не прервать основной процесс замены
        }

        return {
            success: true,
            replacement: replacement,
            oldMaterial: replacement.Material,
            newMaterial: newMaterial
        };
    } catch (err) {
        console.error('Ошибка при обработке замены материала:', err);
        throw new Error(err.message || 'Ошибка сервера');
    }
}

// Получить общую статистику для админ-панели
export async function getAdminStats() {
    try {
        // Общая выручка
        const totalRevenue = await Order.sum('total_sum', {
            where: {
                status: 'completed',
                payment_status: 'paid'
            }
        }) || 0;

        // Общее количество заказов
        const totalOrders = await Order.count();

        // Завершенные заказы
        const completedOrders = await Order.count({
            where: { status: 'completed' }
        });

        // Активные заказы
        const activeOrders = await Order.count({
            where: { status: 'in_progress' }
        });

        // Средний чек
        const averageCheck = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

        // Конверсия (процент завершенных заказов)
        const conversionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100 * 10) / 10 : 0;

        // Количество исполнителей
        const totalExecuters = await Executer.count();

        // Активные исполнители (за последние 24 часа)
        const activeExecuters = await Executer.count({
            where: {
                last_activity: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        // Средний рейтинг исполнителей
        const avgRating = await Executer.findOne({
            attributes: [
                [Executer.sequelize.fn('AVG', Executer.sequelize.col('rating')), 'avgRating']
            ]
        });
        const averageRating = avgRating ? Math.round(avgRating.dataValues.avgRating * 10) / 10 : 0;

        // Статистика заявок на замену
        const totalReplacements = await MaterialReplacement.count();
        const pendingReplacements = await MaterialReplacement.count({
            where: { status: 'pending' }
        });

        // Статистика материалов
        const totalMaterials = await Material.count();
        const availableMaterials = await Material.count({
            where: { status: MATERIAL_STATUS.AVAILABLE }
        });
        const usedMaterials = await Material.count({
            where: { status: MATERIAL_STATUS.USED }
        });

        return {
            revenue: {
                total: totalRevenue,
                average: averageCheck,
                growth: 23.5 // Можно вычислить рост по дням/месяцам
            },
            orders: {
                total: totalOrders,
                completed: completedOrders,
                active: activeOrders,
                conversion: conversionRate
            },
            executers: {
                total: totalExecuters,
                active: activeExecuters,
                averageRating: averageRating
            },
            materials: {
                total: totalMaterials,
                available: availableMaterials,
                used: usedMaterials
            },
            replacements: {
                total: totalReplacements,
                pending: pendingReplacements
            }
        };
    } catch (err) {
        console.error('Ошибка при получении статистики:', err);
        throw new Error('Ошибка сервера');
    }
}

// Получить доступные материалы для замены
export async function getAvailableMaterialsForReplacementAdmin(serviceId) {
    try {
        const materials = await Material.findAll({
            where: {
                service_id: serviceId,
                status: MATERIAL_STATUS.AVAILABLE
            },
            attributes: ['id', 'type_key', 'contents', 'added_date'],
            order: [['added_date', 'DESC']]
        });

        return materials;
    } catch (err) {
        console.error('Ошибка при получении доступных материалов:', err);
        throw new Error('Ошибка сервера');
    }
}

// Заменить материал
export async function replaceMaterial(oldMaterialId, newMaterialId) {
    try {
        // Получаем старый материал
        const oldMaterial = await Material.findByPk(oldMaterialId);
        if (!oldMaterial) {
            throw new Error('Старый материал не найден');
        }

        // Получаем новый материал
        const newMaterial = await Material.findByPk(newMaterialId);
        if (!newMaterial) {
            throw new Error('Новый материал не найден');
        }

        // Проверяем, что новый материал доступен
        if (newMaterial.status !== MATERIAL_STATUS.AVAILABLE) {
            throw new Error('Новый материал не доступен для использования');
        }

        // Проверяем, что материалы относятся к одной услуге
        if (oldMaterial.service_id !== newMaterial.service_id) {
            throw new Error('Материалы должны относиться к одной услуге');
        }

        // Обновляем статусы материалов
        // Старый материал помечаем как "заменен" для корректной статистики
        await Material.update(
            {
                status: MATERIAL_STATUS.REPLACED,
                replaced_date: new Date() // Добавляем дату замены
            },
            { where: { id: oldMaterialId } }
        );

        await Material.update(
            {
                status: MATERIAL_STATUS.USED,
                order_number: oldMaterial.order_number,
                executer_id: oldMaterial.executer_id,
                executer_name: oldMaterial.executer_name,
                used_date: new Date() // Добавляем дату использования
            },
            { where: { id: newMaterialId } }
        );

        // Пытаемся отправить уведомление в бота
        try {
            const botModule = await import('../../../bot/executerBot.js');
            if (botModule && botModule.notifyMaterialReplacement) {
                // Получаем информацию об исполнителе для получения telegram_id
                const executer = await Executer.findByPk(oldMaterial.executer_id);
                const service = await Services.findByPk(oldMaterial.service_id);

                if (executer && executer.telegram_id) {
                    await botModule.notifyMaterialReplacement({
                        telegramId: executer.telegram_id,
                        orderNumber: oldMaterial.order_number,
                        serviceName: service ? service.name : 'Неизвестная услуга',
                        oldMaterial: oldMaterial.contents,
                        newMaterial: newMaterial.contents,
                        adminComment: null // Можно будет добавить в будущем
                    });
                }
            }
        } catch (botError) {
            console.warn('Не удалось отправить уведомление в бота:', botError.message);
        }

        console.log(`✅ Материал заменен: ${oldMaterial.contents} → ${newMaterial.contents}`);

        return {
            success: true,
            message: 'Материал успешно заменен',
            oldMaterial: {
                id: oldMaterial.id,
                contents: oldMaterial.contents
            },
            newMaterial: {
                id: newMaterial.id,
                contents: newMaterial.contents
            }
        };
    } catch (err) {
        console.error('Ошибка при замене материала:', err);
        throw new Error(err.message || 'Ошибка сервера');
    }
}