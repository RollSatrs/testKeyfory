import { DataTypes } from 'sequelize';
import { sequelize } from '../databaseOn.js';

const LimitApprovalRequest = sequelize.define('LimitApprovalRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  executer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'executers',
      key: 'id'
    }
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
    type: DataTypes.STRING,  // Изменено с ENUM на STRING
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
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
  }
}, {
  tableName: 'limit_approval_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // Не синхронизировать автоматически, так как таблица уже создана
  sync: false
});

export default LimitApprovalRequest;
