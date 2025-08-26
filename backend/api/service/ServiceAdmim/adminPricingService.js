import { ExecuterPricing, Executer, Services } from '../../../database/dbTables.js';

class AdminPricingService {

    // Получить все индивидуальные цены
    async getAllPricing() {
        try {
            const pricing = await ExecuterPricing.findAll({
                include: [
                    {
                        model: Executer,
                        attributes: ['id', 'name', 'telegram_id']
                    },
                    {
                        model: Services,
                        attributes: ['id', 'name', 'price']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return pricing.map(item => ({
                id: item.id,
                executer_id: item.executer_id,
                service_id: item.service_id,
                custom_price: item.custom_price,
                base_price: item.Service ? item.Service.price : 0,
                executer_name: item.Executer ? item.Executer.name : null,
                service_name: item.Service ? item.Service.name : null,
                created_at: item.created_at
            }));
        } catch (error) {
            console.error('Ошибка получения ценообразования:', error);
            throw error;
        }
    }

    // Добавить индивидуальную цену
    async addCustomPricing(executer_id, service_id, custom_price) {
        try {
            // Проверяем, существует ли уже индивидуальная цена для этой пары
            const existing = await ExecuterPricing.findOne({
                where: { executer_id, service_id }
            });

            if (existing) {
                // Обновляем существующую цену
                existing.custom_price = custom_price;
                await existing.save();
                return existing;
            }

            // Создаем новую запись
            const pricing = await ExecuterPricing.create({
                executer_id,
                service_id,
                custom_price
            });

            return pricing;
        } catch (error) {
            console.error('Ошибка добавления ценообразования:', error);
            throw error;
        }
    }

    // Обновить индивидуальную цену
    async updateCustomPricing(id, custom_price) {
        try {
            const pricing = await ExecuterPricing.findByPk(id);
            if (!pricing) {
                throw new Error('Ценообразование не найдено');
            }

            pricing.custom_price = custom_price;
            await pricing.save();

            return pricing;
        } catch (error) {
            console.error('Ошибка обновления ценообразования:', error);
            throw error;
        }
    }

    // Удалить индивидуальную цену
    async deleteCustomPricing(id) {
        try {
            const pricing = await ExecuterPricing.findByPk(id);
            if (!pricing) {
                throw new Error('Ценообразование не найдено');
            }

            await pricing.destroy();
            return true;
        } catch (error) {
            console.error('Ошибка удаления ценообразования:', error);
            throw error;
        }
    }

    // Получить цену для исполнителя и услуги
    async getPriceForExecuter(executer_id, service_id) {
        try {
            // Сначала ищем индивидуальную цену
            const customPricing = await ExecuterPricing.findOne({
                where: { executer_id, service_id }
            });

            if (customPricing) {
                return customPricing.custom_price;
            }

            // Если индивидуальной цены нет, возвращаем базовую цену услуги
            const service = await Services.findByPk(service_id);
            return service ? service.price : 0;
        } catch (error) {
            console.error('Ошибка получения цены:', error);
            return 0;
        }
    }

    // Получить детальную таблицу заработков
    async getEarningsDetails(filters = {}) {
        try {
            // Импортируем adminEarningsService для получения реальных заработков
            const { default: adminEarningsService } = await import('./adminEarningsService.js');

            // Получаем все заработки с фильтрами
            const earnings = await adminEarningsService.getAllEarnings(filters);

            // Преобразуем данные в нужный формат для таблицы
            const earningsDetails = earnings.map(earning => ({
                id: earning.id,
                executer_name: earning.Executer?.name || `Исполнитель ${earning.executer_id}`,
                service_name: earning.Service?.name || `Услуга ${earning.service_id}`,
                amount: earning.amount || 0,
                date: earning.created_at,
                order_id: earning.order_id,
                executer_id: earning.executer_id,
                service_id: earning.service_id,
                status: earning.status
            }));

            return earningsDetails;
        } catch (error) {
            console.error('Ошибка получения детальных заработков:', error);
            throw error;
        }
    }
}

export default new AdminPricingService();
