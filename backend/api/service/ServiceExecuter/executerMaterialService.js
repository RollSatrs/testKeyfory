import { Material, Services, Order } from '../../../database/dbTables.js';
import { Op } from 'sequelize';
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';

// Получить материалы, доступные для исполнителя (для его заказов)
export const getMyMaterials = async (executerId) => {
  try {
    const materials = await Material.findAll({
      include: [
        {
          model: Order,
          where: { executer_id: executerId },
          attributes: ['id', 'status'],
          include: [
            {
              model: Services,
              attributes: ['id', 'name', 'category']
            }
          ]
        }
      ],
      where: {
          // return materials assigned to executer's orders (those with order_id linked to executer's orders)
          // include both used (history) and currently assigned ones
        },
      order: [['added_date', 'DESC']]
    });

    return materials;
  } catch (error) {
    console.error('Ошибка при получении материалов исполнителя:', error);
    throw new Error('Ошибка при получении материалов');
  }
};

// Получить доступные материалы для конкретного заказа
export const getMaterialsForOrder = async (orderId, executerId) => {
  try {
    // Проверяем, что заказ принадлежит исполнителю
    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: executerId
      },
      include: [Services]
    });

    if (!order) {
      throw new Error('Заказ не найден или не принадлежит исполнителю');
    }

    // Получаем материалы для услуги этого заказа, которые еще не использованы
    const materials = await Material.findAll({
      where: {
        service_id: order.service_id,
        [Op.or]: [
          { is_used: false },
          { is_used: null }
        ]
      },
      order: [['added_date', 'ASC']]
    });

    return materials;
  } catch (error) {
    console.error('Ошибка при получении материалов для заказа:', error);
    throw new Error(error.message || 'Ошибка при получении материалов для заказа');
  }
};

// Использовать материал для заказа
export const useMaterial = async (materialId, orderId, executerId) => {
  try {
    // Проверяем, что заказ принадлежит исполнителю
    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: executerId,
        status: 'in_progress'
      }
    });

    if (!order) {
      throw new Error('Заказ не найден, не принадлежит исполнителю или не в работе');
    }

    // Проверяем, что материал не привязан к другому заказу и не использован
    const material = await Material.findOne({
      where: {
        id: materialId,
        service_id: order.service_id,
        order_id: null
      }
    });

    if (!material) {
      throw new Error('Материал не найден или уже использован');
    }

    // Обновляем материал: помечаем как использованный и привязываем к заказу
    await Material.update(
      {
        status: MATERIAL_STATUS.USED,
        order_id: orderId,
        used_date: new Date(),
        executer_id: executerId
      },
      { where: { id: materialId } }
    );

    const updatedMaterial = await Material.findOne({
      where: { id: materialId },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'category']
        },
        {
          model: Order,
          attributes: ['id', 'status']
        }
      ]
    });

    return updatedMaterial;
  } catch (error) {
    console.error('Ошибка при использовании материала:', error);
    throw new Error(error.message || 'Ошибка при использовании материала');
  }
};

// Получить статистику материалов для исполнителя
export const getMaterialsStats = async (executerId) => {
  try {
    const totalUsed = await Material.count({
      include: [
        {
          model: Order,
          where: { executer_id: executerId }
        }
      ],
      where: { status: MATERIAL_STATUS.USED }
    });

    const availableForMyOrders = await Material.count({
      include: [
        {
          model: Services,
          include: [
            {
              model: Order,
              where: {
                executer_id: executerId,
                status: 'in_progress'
              }
            }
          ]
        }
      ],
      where: {
        status: MATERIAL_STATUS.AVAILABLE,
        order_id: null
      }
    });

    return {
      totalUsed,
      availableForMyOrders
    };
  } catch (error) {
    console.error('Ошибка при получении статистики материалов:', error);
    throw new Error('Ошибка при получении статистики материалов');
  }
};

// Запрос замены материала
export const requestMaterialReplacement = async (materialId, executerId, reason = '') => {
  try {
    // Проверяем, что материал существует и используется в заказе исполнителя
    const material = await Material.findOne({
      where: { id: materialId },
      include: [
        {
          model: Order,
          where: { executer_id: executerId },
          attributes: ['id', 'executer_id']
        }
      ]
    });

    if (!material) {
      throw new Error('Материал не найден или не принадлежит вашим заказам');
    }

    if (material.status !== MATERIAL_STATUS.USED) {
      throw new Error('Можно запросить замену только для использованных материалов');
    }

    // Обновляем статус материала на "pending_replace" и устанавливаем дату запроса
    await material.update({
      status: 'pending_replace',
      replacement_requested_date: new Date()
    });

    return {
      success: true,
      message: 'Запрос на замену материала отправлен',
      material
    };
  } catch (error) {
    console.error('Ошибка при запросе замены материала:', error);
    throw new Error(error.message || 'Ошибка при запросе замены материала');
  }
};

// Пометить материал как использованный (резервация для конкретного исполнителя)
export const markMaterialAsUsed = async (materialId, executerId, orderNumber, reason = 'Материал выдан исполнителю') => {
  try {
    console.log(`🔒 Начинаем пометку материала ${materialId} как использованный для исполнителя ${executerId}`);

    // Находим материал
    const material = await Material.findOne({
      where: { id: materialId }
    });

    if (!material) {
      throw new Error('Материал не найден');
    }

    // Проверяем, что материал еще не использован
    if (material.is_used) {
      console.warn(`⚠️ Материал ${materialId} уже помечен как использованный`);
      return material;
    }

    // Находим заказ по номеру
    const order = await Order.findOne({
      where: { order_number: orderNumber, executer_id: executerId }
    });

    if (!order) {
      throw new Error(`Заказ ${orderNumber} не найден для исполнителя ${executerId}`);
    }

    // Помечаем материал как использованный
    await material.update({
      is_used: true,
      used_date: new Date(),
      order_id: order.id,
      used_reason: reason
    });

    console.log(`✅ Материал ${materialId} успешно помечен как использованный для заказа ${orderNumber}`);

    return material;
  } catch (error) {
    console.error('Ошибка при пометке материала как использованного:', error);
    throw new Error(error.message || 'Ошибка при пометке материала как использованного');
  }
};
