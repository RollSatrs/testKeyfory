import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../database/databaseOn.js';

async function createExecuterLimitsTable() {
  try {
    console.log('🚀 Создание таблицы лимитов исполнителей...');

    // Создаем таблицу ExecuterLimits
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ExecuterLimits (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        max_orders INTEGER DEFAULT 5,
        used_orders INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT false,
        requires_admin_approval BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        CONSTRAINT fk_executer_limits_executer FOREIGN KEY (executer_id) REFERENCES Executers(id) ON DELETE CASCADE,
        CONSTRAINT fk_executer_limits_service FOREIGN KEY (service_id) REFERENCES Services(id) ON DELETE CASCADE,
        CONSTRAINT unique_executer_service UNIQUE(executer_id, service_id)
      )
    `);

    // Создаем таблицу LimitApprovalRequests для запросов на увеличение лимита
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS LimitApprovalRequests (
        id SERIAL PRIMARY KEY,
        executer_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        current_limit INTEGER NOT NULL,
        requested_limit INTEGER NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_id INTEGER,
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        CONSTRAINT fk_limit_requests_executer FOREIGN KEY (executer_id) REFERENCES Executers(id) ON DELETE CASCADE,
        CONSTRAINT fk_limit_requests_service FOREIGN KEY (service_id) REFERENCES Services(id) ON DELETE CASCADE,
        CONSTRAINT fk_limit_requests_admin FOREIGN KEY (admin_id) REFERENCES Admins(id)
      )
    `);

    console.log('✅ Таблицы лимитов исполнителей созданы успешно');

    // Создаем дефолтные лимиты для всех существующих исполнителей и услуг
    console.log('📊 Создание дефолтных лимитов...');

    await sequelize.query(`
      INSERT INTO ExecuterLimits (executer_id, service_id, max_orders, used_orders, notes)
      SELECT
        e.id as executer_id,
        s.id as service_id,
        5 as max_orders,  -- дефолтный лимит 5 заказов для всех
        0 as used_orders,
        'Автоматически созданный лимит' as notes
      FROM Executers e
      CROSS JOIN Services s
      WHERE e.status = 'active' AND s.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM ExecuterLimits el
          WHERE el.executer_id = e.id AND el.service_id = s.id
        )
    `);

    console.log('✅ Дефолтные лимиты созданы');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка создания таблиц лимитов:', error);
    process.exit(1);
  }
}

createExecuterLimitsTable();
