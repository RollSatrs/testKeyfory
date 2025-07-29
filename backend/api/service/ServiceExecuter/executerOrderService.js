import { Order, Services, Material, Executer } from '../../../database/dbTables.js';
import { Op } from 'sequelize';

// Получить все заказы текущего исполнителя
export const getMyOrders = async (executerId) => {
  try {
    const orders = await Order.findAll({
      where: { executer_id: executerId },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category']
        },
        {
          model: Material,
          attributes: ['id', 'type_key', 'contents', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return orders;
  } catch (error) {
    console.error('Ошибка при получении заказов исполнителя:', error);
    throw new Error('Ошибка при получении заказов');
  }
};

// Получить доступные заказы (без исполнителя)
export const getAvailableOrders = async () => {
  try {
    const orders = await Order.findAll({
      where: {
        executer_id: null,
        status: 'pending'
      },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return orders;
  } catch (error) {
    console.error('Ошибка при получении доступных заказов:', error);
    throw new Error('Ошибка при получении доступных заказов');
  }
};

// Взять заказ в работу
export const takeOrder = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: null,
        status: 'pending'
      }
    });

    if (!order) {
      throw new Error('Заказ не найден или уже взят в работу');
    }

    // Проверяем, что исполнитель активен
    const executer = await Executer.findOne({
      where: { id: executerId, status: 'active' }
    });

    if (!executer) {
      throw new Error('Исполнитель не активен');
    }

    await Order.update(
      {
        executer_id: executerId,
        status: 'in_progress'
      },
      { where: { id: orderId } }
    );

    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category']
        }
      ]
    });

    return updatedOrder;
  } catch (error) {
    console.error('Ошибка при взятии заказа:', error);
    throw new Error(error.message || 'Ошибка при взятии заказа');
  }
};

// Обновить статус заказа
export const updateOrderStatus = async (orderId, executerId, status) => {
  try {
    const validStatuses = ['in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error('Недопустимый статус заказа');
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: executerId
      }
    });

    if (!order) {
      throw new Error('Заказ не найден или не принадлежит исполнителю');
    }

    await Order.update(
      { status: status },
      { where: { id: orderId, executer_id: executerId } }
    );

    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: Services,
          attributes: ['id', 'name', 'description', 'category']
        },
        {
          model: Material,
          attributes: ['id', 'type_key', 'contents', 'status']
        }
      ]
    });

    return updatedOrder;
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error);
    throw new Error(error.message || 'Ошибка при обновлении статуса заказа');
  }
};

// Отменить заказ (вернуть в доступные)
export const cancelOrder = async (orderId, executerId) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        executer_id: executerId,
        status: { [Op.in]: ['in_progress', 'pending'] }
      }
    });

    if (!order) {
      throw new Error('Заказ не найден или не может быть отменен');
    }

    await Order.update(
      {
        executer_id: null,
        status: 'pending'
      },
      { where: { id: orderId } }
    );

    return { message: 'Заказ успешно отменен и возвращен в доступные' };
  } catch (error) {
    console.error('Ошибка при отмене заказа:', error);
    throw new Error(error.message || 'Ошибка при отмене заказа');
  }
};
