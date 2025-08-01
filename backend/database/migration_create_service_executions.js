import { sequelize } from './databaseOn.js';
import { DataTypes } from 'sequelize';

const createServiceExecutionsTable = async () => {
  try {
    console.log('🔧 === СОЗДАНИЕ ТАБЛИЦЫ SERVICE_EXECUTIONS ===');

    // Создаем таблицу service_executions
    await sequelize.getQueryInterface().createTable('service_executions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      order_number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      material_contents: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        allowNull: false
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    });

    console.log('✅ Таблица service_executions создана успешно');

    // Добавляем индексы для быстрого поиска
    await sequelize.getQueryInterface().addIndex('service_executions', ['executer_id'], {
      name: 'idx_service_executions_executer_id'
    });

    await sequelize.getQueryInterface().addIndex('service_executions', ['service_id'], {
      name: 'idx_service_executions_service_id'
    });

    await sequelize.getQueryInterface().addIndex('service_executions', ['order_number'], {
      name: 'idx_service_executions_order_number'
    });

    await sequelize.getQueryInterface().addIndex('service_executions', ['status'], {
      name: 'idx_service_executions_status'
    });

    console.log('✅ Индексы для service_executions созданы успешно');

    // Обновляем таблицу material_replacements для связи с service_executions
    const tableInfo = await sequelize.getQueryInterface().describeTable('material_replacements');

    if (!tableInfo.service_execution_id) {
      await sequelize.getQueryInterface().addColumn('material_replacements', 'service_execution_id', {
        type: DataTypes.INTEGER,
        allowNull: true, // делаем nullable для существующих записей
        references: {
          model: 'service_executions',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });

      console.log('✅ Поле service_execution_id добавлено в material_replacements');
    }

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы service_executions:', error);
    throw error;
  }
};

// Запускаем миграцию
if (import.meta.url === `file://${process.argv[1]}`) {
  createServiceExecutionsTable()
    .then(() => {
      console.log('🎉 Миграция service_executions завершена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ошибка миграции:', error);
      process.exit(1);
    });
}

export { createServiceExecutionsTable };
