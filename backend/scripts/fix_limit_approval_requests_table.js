import { sequelize } from '../database/databaseOn.js';

async function fixLimitApprovalRequestsTable() {
  try {
    console.log('🔧 Исправляем таблицу limit_approval_requests...');

    // Удаляем таблицу если она существует
    await sequelize.getQueryInterface().dropTable('limit_approval_requests', { cascade: true });
    console.log('✅ Старая таблица удалена');

    // Удаляем ENUM тип если он существует
    try {
      await sequelize.query('DROP TYPE IF EXISTS "public"."enum_limit_approval_requests_status" CASCADE;');
      console.log('✅ Старый ENUM тип удален');
    } catch (e) {
      console.log('⚠️ ENUM тип не найден, пропускаем');
    }

    // Создаем ENUM тип заново
    await sequelize.query(`
      CREATE TYPE "public"."enum_limit_approval_requests_status" AS ENUM('pending', 'approved', 'rejected');
    `);
    console.log('✅ ENUM тип создан');

    // Создаем таблицу заново с правильными типами
    await sequelize.query(`
      CREATE TABLE "limit_approval_requests" (
        "id" SERIAL PRIMARY KEY,
        "executer_id" INTEGER NOT NULL REFERENCES "executers"("id") ON DELETE CASCADE,
        "current_services_count" INTEGER NOT NULL,
        "current_limit" INTEGER,
        "requested_limit" INTEGER,
        "status" "public"."enum_limit_approval_requests_status" NOT NULL DEFAULT 'pending',
        "request_reason" TEXT,
        "admin_comment" TEXT,
        "processed_by" INTEGER REFERENCES "admins"("id"),
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Таблица создана с правильными типами');

    // Создаем индексы
    await sequelize.query(`
      CREATE INDEX "limit_approval_requests_executer_id" ON "limit_approval_requests" ("executer_id");
      CREATE INDEX "limit_approval_requests_status" ON "limit_approval_requests" ("status");
      CREATE INDEX "limit_approval_requests_created_at" ON "limit_approval_requests" ("created_at");
    `);
    console.log('✅ Индексы созданы');

    console.log('🎉 Таблица limit_approval_requests успешно исправлена!');

  } catch (error) {
    console.error('❌ Ошибка при исправлении таблицы:', error);
    throw error;
  }
}

// Запускаем скрипт
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fixLimitApprovalRequestsTable()
    .then(() => {
      console.log('✅ Скрипт выполнен успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка скрипта:', error);
      process.exit(1);
    });
}

export { fixLimitApprovalRequestsTable };
