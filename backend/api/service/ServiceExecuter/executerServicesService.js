import { Services, Material, Order } from '../../../database/dbTables.js';
import { sequelize } from '../../../database/databaseOn.js';
import { Op } from 'sequelize';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

// Получить все доступные услуги для исполнителя
export const getAvailableServices = async () => {
  try {
    const services = await Services.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: Material,
          where: { status: MATERIAL_STATUS.AVAILABLE },
          required: false,
          attributes: ['id', 'type_key', 'status']
        }
      ],
      order: [['create_date_service', 'DESC']]
    });

    // Добавляем количество доступных материалов для каждой услуги
    const servicesWithMaterialCount = services.map(service => {
      const serviceData = service.toJSON();
      serviceData.available_materials_count = service.Materials ? service.Materials.length : 0;
      return serviceData;
    });

    return servicesWithMaterialCount;
  } catch (error) {
    console.error('Ошибка при получении доступных услуг:', error);
    throw new Error('Ошибка при получении доступных услуг');
  }
};

// Получить детали конкретной услуги
export const getServiceDetails = async (serviceId) => {
  try {
    const service = await Services.findOne({
      where: {
        id: serviceId,
        status: 'active'
      },
      include: [
        {
          model: Material,
          where: { status: MATERIAL_STATUS.AVAILABLE },
          required: false,
          attributes: ['id', 'type_key', 'status', 'added_date']
        },
        {
          model: Order,
          where: { status: { [Op.in]: ['pending', 'in_progress'] } },
          required: false,
          attributes: ['id', 'status', 'created_at']
        }
      ]
    });

    if (!service) {
      throw new Error('Услуга не найдена или недоступна');
    }

    const serviceData = service.toJSON();
    serviceData.available_materials_count = service.Materials ? service.Materials.length : 0;
    serviceData.pending_orders_count = service.Orders ? service.Orders.length : 0;

    return serviceData;
  } catch (error) {
    console.error('Ошибка при получении деталей услуги:', error);
    throw new Error(error.message || 'Ошибка при получении деталей услуги');
  }
};

// Получить услуги, с которыми работает исполнитель
export const getMyServices = async (executerId) => {
  try {
    const services = await Services.findAll({
      include: [
        {
          model: Order,
          where: { executer_id: executerId },
          attributes: ['id', 'status', 'created_at'],
          required: true
        }
      ],
      group: ['Services.id', 'Orders.id'],
      order: [['create_date_service', 'DESC']]
    });

    // Подсчитываем статистику для каждой услуги
    const servicesWithStats = await Promise.all(
      services.map(async (service) => {
        const serviceData = service.toJSON();

        // Подсчитываем заказы по статусам
        const orderStats = await Order.findAll({
          where: {
            service_id: service.id,
            executer_id: executerId
          },
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        serviceData.order_stats = orderStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {});

        return serviceData;
      })
    );

    return servicesWithStats;
  } catch (error) {
    console.error('Ошибка при получении услуг исполнителя:', error);
    throw new Error('Ошибка при получении услуг исполнителя');
  }
};

// Получить статистику услуг для исполнителя
export const getServicesStats = async (executerId) => {
  try {
    const totalServices = await Services.count({
      include: [
        {
          model: Order,
          where: { executer_id: executerId },
          required: true
        }
      ],
      distinct: true,
      col: 'Services.id'
    });

    const availableServices = await Services.count({
      where: { status: 'active' },
      include: [
        {
          model: Material,
          where: { status: MATERIAL_STATUS.AVAILABLE },
          required: true
        }
      ],
      distinct: true,
      col: 'Services.id'
    });

    return {
      totalServicesWorkedWith: totalServices,
      availableServices: availableServices
    };
  } catch (error) {
    console.error('Ошибка при получении статистики услуг:', error);
    throw new Error('Ошибка при получении статистики услуг');
  }
};
