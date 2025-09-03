import express from 'express';
import LimitApprovalRequest from '../../../database/models/LimitApprovalRequest.js';
import { Executer } from '../../../database/dbTables.js';
import { sequelize } from '../../../database/databaseOn.js';

const router = express.Router();

// Создать запрос на одобрение превышения лимита
router.post('/create', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { executer_id, current_services_count, current_limit, requested_limit, request_reason } = req.body;

    // Проверяем, что исполнитель существует
    const executer = await Executer.findByPk(executer_id);
    if (!executer) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Исполнитель не найден' });
    }

    // Проверяем, есть ли уже активный запрос
    const existingRequest = await LimitApprovalRequest.findOne({
      where: {
        executer_id: executer_id,
        status: 'pending'
      }
    });

    if (existingRequest) {
      await transaction.rollback();
      return res.status(400).json({ error: 'У исполнителя уже есть активный запрос на одобрение' });
    }

    // Создаем новый запрос
    const approvalRequest = await LimitApprovalRequest.create({
      executer_id,
      current_services_count,
      current_limit,
      requested_limit,
      request_reason: request_reason || null,
      status: 'pending'
    }, { transaction });

    await transaction.commit();

    res.json({
      message: 'Запрос на одобрение создан успешно',
      request: approvalRequest
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Ошибка создания запроса на одобрение:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить все запросы на одобрение для админа
router.get('/admin/all', async (req, res) => {
  try {
    const { status } = req.query; // pending, approved, rejected или все

    const where = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const requests = await LimitApprovalRequest.findAll({
      where,
      include: [
        {
          model: Executer,
          as: 'executer',
          attributes: ['id', 'name', 'telegram_id', 'active_services_limit']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(requests);

  } catch (error) {
    console.error('Ошибка получения запросов на одобрение:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить активные запросы конкретного исполнителя
router.get('/executer/:executer_id', async (req, res) => {
  try {
    const { executer_id } = req.params;

    const requests = await LimitApprovalRequest.findAll({
      where: {
        executer_id,
        status: 'pending'
      },
      order: [['created_at', 'DESC']]
    });

    res.json(requests);

  } catch (error) {
    console.error('Ошибка получения запросов исполнителя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обработать запрос (одобрить/отклонить)
router.patch('/process/:request_id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { request_id } = req.params;
    const { action, admin_comment, new_limit, expires_hours } = req.body; // action: 'approve' или 'reject'

    if (!['approve', 'reject'].includes(action)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Некорректное действие. Используйте approve или reject' });
    }

    const request = await LimitApprovalRequest.findByPk(request_id, {
      include: [
        {
          model: Executer,
          as: 'executer'
        }
      ]
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Запрос уже был обработан' });
    }

    // Обновляем статус запроса
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      admin_comment: admin_comment || null,
      processed_by: 1, // TODO: получать ID админа из токена/сессии
      processed_at: new Date()
    };

    // Если одобряем и указан срок действия
    if (action === 'approve' && expires_hours) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expires_hours));
      updateData.expires_at = expiresAt;
    }

    await request.update(updateData, { transaction });

    // Если запрос одобрен и указан новый лимит, обновляем лимит исполнителя
    if (action === 'approve' && new_limit) {
      await request.executer.update({
        active_services_limit: parseInt(new_limit)
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      message: `Запрос ${action === 'approve' ? 'одобрен' : 'отклонен'}`,
      request: await LimitApprovalRequest.findByPk(request_id, {
        include: [
          {
            model: Executer,
            as: 'executer',
            attributes: ['id', 'name', 'telegram_id', 'active_services_limit']
          }
        ]
      })
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Ошибка обработки запроса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить статистику запросов
router.get('/stats', async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      LimitApprovalRequest.count({ where: { status: 'pending' } }),
      LimitApprovalRequest.count({ where: { status: 'approved' } }),
      LimitApprovalRequest.count({ where: { status: 'rejected' } }),
      LimitApprovalRequest.count()
    ]);

    res.json({
      pending,
      approved,
      rejected,
      total
    });

  } catch (error) {
    console.error('Ошибка получения статистики запросов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
