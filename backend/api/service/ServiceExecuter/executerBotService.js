import { Executer, Services, Material, ExecuterServiceAssignment, ExecuterPricing, Order } from '../../../database/dbTables.js';
import { Op } from 'sequelize';
import { SERVICE_STATUS, MATERIAL_STATUS, ORDER_STATUS } from '../../../constants/statusConstants.js';

class ExecuterBotService {
  // Получить услуги доступные исполнителю с индивидуальными ценами
  static async getAvailableServices(executerId) {
    try {
      console.log(`🔍 Поиск услуг для исполнителя ID: ${executerId}`);

      // Сначала пробуем получить услуги через ExecuterPricing для индивидуальных цен
      const pricings = await ExecuterPricing.findAll({
        where: { executer_id: executerId },
        include: [{
          model: Services,
          where: { status: SERVICE_STATUS.ACTIVE }
        }]
      });

      console.log(`📋 Найдено индивидуальных цен: ${pricings.length}`);

      if (pricings.length > 0) {
        // Если есть индивидуальные цены, используем их
        const services = pricings
          .map(pricing => {
            const service = pricing.Service;
            if (!service) {
              console.warn(`⚠️  Пустая услуга в ценообразовании ID: ${pricing.id}`);
              return null;
            }

            const serviceWithPrice = {
              id: service.id,
              name: service.name,
              description: service.description,
              price: pricing.custom_price, // Индивидуальная цена исполнителя
              service_id: service.id,
              service_title: service.name
            };

            console.log(`✅ Услуга найдена: ${service.name} (ID: ${service.id}, Цена: ${pricing.custom_price}₽)`);
            return serviceWithPrice;
          })
          .filter(service => service !== null);

        console.log(`🎯 Возвращаем услуг из ExecuterPricing: ${services.length}`);
        return services;
      }

      // Если нет индивидуальных цен, используем старую систему через ExecuterServiceAssignment
      console.log(`⚠️ Нет индивидуальных цен, используем ExecuterServiceAssignment`);

      const assignments = await ExecuterServiceAssignment.findAll({
        where: { executer_id: executerId },
        include: [{
          model: Services,
          where: { status: SERVICE_STATUS.ACTIVE }
        }]
      });

      console.log(`📋 Найдено назначений: ${assignments.length}`);

      const services = assignments
        .map(assignment => {
          const service = assignment.Services;
          if (!service) {
            console.warn(`⚠️  Пустая услуга в назначении ID: ${assignment.id}`);
            return null;
          }

          const serviceWithPrice = {
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price || 0, // Базовая цена услуги
            service_id: service.id,
            service_title: service.name
          };

          console.log(`✅ Услуга найдена: ${service.name} (ID: ${service.id}, Базовая цена: ${service.price || 0}₽)`);
          return serviceWithPrice;
        })
        .filter(service => service !== null);

      console.log(`🎯 Возвращаем услуг из ExecuterServiceAssignment: ${services.length}`);
      return services;
    } catch (error) {
      console.error('Ошибка получения доступных услуг:', error);
      throw error;
    }
  }

  // Привязать номер заказа к услуге и получить расходник
  static async assignOrderAndGetMaterial(executerId, serviceId, orderNumber) {
    try {
      // Проверяем что услуга назначена этому исполнителю
      const assignment = await ExecuterServiceAssignment.findOne({
        where: {
          executer_id: executerId,
          service_id: serviceId
        }
      });

      if (!assignment) {
        throw new Error('Услуга не назначена данному исполнителю');
      }

      // Находим доступный материал для этой услуги
      const material = await Material.findOne({
        where: {
          service_id: serviceId,
          status: MATERIAL_STATUS.AVAILABLE
        }
      });

      if (!material) {
        throw new Error('Нет доступных материалов для данной услуги');
      }

      // Привязываем номер заказа к материалу
      await material.update({
        order_number: orderNumber,
        status: 'reserved'
      });

      return material;
    } catch (error) {
      console.error('Ошибка привязки заказа:', error);
      throw error;
    }
  }

  // Использовать материал
  static async useMaterial(materialId, executerId) {
    try {
      const material = await Material.findByPk(materialId);

      if (!material) {
        throw new Error('Материал не найден');
      }

      if (material.status !== 'reserved') {
        throw new Error('Материал недоступен для использования');
      }

      // Обновляем статус на использован
      await material.update({
        status: MATERIAL_STATUS.USED,
        used_date: new Date()
      });

      return material;
    } catch (error) {
      console.error('Ошибка использования материала:', error);
      throw error;
    }
  }

  // Запросить замену материала
  static async requestMaterialReplacement(materialId, executerId) {
    try {
      const material = await Material.findByPk(materialId);

      if (!material) {
        throw new Error('Материал не найден');
      }

      // Обновляем статус на замену
      await material.update({
        status: 'pending_replace',
        replacement_requested_date: new Date()
      });

      return material;
    } catch (error) {
      console.error('Ошибка запроса замены:', error);
      throw error;
    }
  }

  // Получить исполнителя по telegram_id
  static async getExecuterByTelegramId(telegramId) {
    try {
      const executer = await Executer.findOne({
        where: { telegram_id: telegramId }
      });

      return executer;
    } catch (error) {
      console.error('Ошибка получения исполнителя:', error);
      throw error;
    }
  }

  // Получить историю материалов исполнителя
  static async getExecuterMaterialHistory(executerId) {
    try {
      const materials = await Material.findAll({
        where: {
          order_number: { [Op.ne]: null }
        },
        include: [{
          model: Services,
          include: [{
            model: ExecuterServiceAssignment,
            where: { executer_id: executerId }
          }]
        }],
        order: [['used_date', 'DESC']]
      });

      return materials;
    } catch (error) {
      console.error('Ошибка получения истории материалов:', error);
      throw error;
    }
  }

  // Создать новый заказ
  static async createOrder(executerId, serviceId, orderNumber) {
    try {
      const { Order, ExecuterPricing } = await import('../../../database/dbTables.js');

      // Проверяем назначение услуги исполнителю
      const assignment = await ExecuterServiceAssignment.findOne({
        where: { executer_id: executerId, service_id: serviceId }
      });

      if (!assignment) {
        throw new Error('Услуга не назначена данному исполнителю');
      }

      // Получаем информацию об услуге
      const service = await Services.findByPk(serviceId);
      if (!service) {
        throw new Error('Услуга не найдена');
      }

      // Получаем индивидуальную цену или используем базовую
      let customPrice = null;
      const pricing = await ExecuterPricing.findOne({
        where: { executer_id: executerId, service_id: serviceId }
      });

      const finalPrice = pricing ? pricing.custom_price : service.price;

      // Создаем заказ
      const order = await Order.create({
        order_number: orderNumber,
        service_id: serviceId,
        executer_id: executerId,
        status: ORDER_STATUS.IN_PROGRESS,
        total_sum: finalPrice,
        payment_status: 'pending'
      });

      // Получаем доступные материалы для этой услуги
      const materials = await Material.findAll({
        where: {
          service_id: serviceId,
          status: MATERIAL_STATUS.AVAILABLE
        }
      });

      return {
        order,
        service,
        materials,
        customPrice: pricing ? pricing.custom_price : null
      };
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      throw error;
    }
  }

  // Отметить материал как используемый для заказа
  static async useMaterialForOrder(executerId, materialId, orderId) {
    try {
      const { Order } = await import('../../../database/dbTables.js');

      // Проверяем заказ
      const order = await Order.findOne({
        where: { id: orderId, executer_id: executerId }
      });

      if (!order) {
        throw new Error('Заказ не найден');
      }

      // Получаем материал
      const material = await Material.findByPk(materialId);
      if (!material) {
        throw new Error('Материал не найден');
      }

      if (material.status !== MATERIAL_STATUS.AVAILABLE) {
        throw new Error('Материал недоступен');
      }

      // Обновляем материал
      await material.update({
        status: MATERIAL_STATUS.IN_USE,
        order_id: orderId
      });

      return material;
    } catch (error) {
      console.error('Ошибка использования материала:', error);
      throw error;
    }
  }

  // Завершить заказ
  static async completeOrder(executerId, orderId) {
    try {
      const { Order } = await import('../../../database/dbTables.js');

      const order = await Order.findOne({
        where: { id: orderId, executer_id: executerId }
      });

      if (!order) {
        throw new Error('Заказ не найден');
      }

      // Обновляем статус заказа
      await order.update({
        status: ORDER_STATUS.AWAITING_PAYMENT
      });

      // Обновляем все материалы заказа как использованные
      await Material.update(
        { status: MATERIAL_STATUS.USED, used_date: new Date() },
        { where: { order_id: orderId, status: MATERIAL_STATUS.IN_USE } }
      );

      return order;
    } catch (error) {
      console.error('Ошибка завершения заказа:', error);
      throw error;
    }
  }
}

export default ExecuterBotService;
