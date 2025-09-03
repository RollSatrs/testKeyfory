import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../database/databaseOn.js';

async function addLimitApprovalRequestsTable() {
  try {
    console.log('Добавляем таблицу limit_approval_requests...');

    // Создаем таблицу для запросов на одобрение превышения лимита
    await sequelize.getQueryInterface().createTable('limit_approval_requests', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      executer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'executers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      current_services_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Количество активных услуг на момент запроса'
      },
      current_limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Текущий лимит исполнителя'
      },
      requested_limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Запрашиваемый новый лимит (может быть null для разового превышения)'
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      request_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Причина запроса (опционально)'
      },
      admin_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Комментарий админа при обработке запроса'
      },
      processed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        comment: 'ID админа, обработавшего запрос'
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Дата и время обработки запроса'
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Дата истечения одобрения (для временных превышений)'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Добавляем индексы для оптимизации
    await sequelize.getQueryInterface().addIndex('limit_approval_requests', ['executer_id']);
    await sequelize.getQueryInterface().addIndex('limit_approval_requests', ['status']);
    await sequelize.getQueryInterface().addIndex('limit_approval_requests', ['created_at']);

    console.log('✅ Таблица limit_approval_requests успешно создана');

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы limit_approval_requests:', error);
  }
}

// Запускаем скрипт, если файл выполняется напрямую
if (process.argv[1] === new URL(import.meta.url).pathname) {
  addLimitApprovalRequestsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Ошибка:', error);
      process.exit(1);
    });
}

export { addLimitApprovalRequestsTable };
