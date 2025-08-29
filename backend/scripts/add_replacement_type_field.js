// Скрипт для добавления поля replacement_type в таблицу services
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Определяем путь к .env файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
console.log('📄 [add_replacement_type_field.js] Использую .env файл:', envPath);

dotenv.config({ path: envPath });

// Импортируем модуль базы данных
const { sequelize } = await import('../database/databaseOn.js');

try {
    console.log('🔧 Добавление поля replacement_type в таблицу services...');

    // Проверяем существует ли поле
    const [results] = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'replacement_type';"
    );

    if (results.length > 0) {
        console.log('✅ Поле replacement_type уже существует');
    } else {
        // Добавляем поле replacement_type
        await sequelize.query(
            "ALTER TABLE services ADD COLUMN replacement_type VARCHAR(255) DEFAULT 'manual';"
        );
        console.log('✅ Поле replacement_type успешно добавлено');
    }

    // Устанавливаем значения по умолчанию для существующих записей
    const [updateResult] = await sequelize.query(
        "UPDATE services SET replacement_type = 'manual' WHERE replacement_type IS NULL;"
    );

    console.log(`✅ Обновлено записей: ${updateResult.affectedRows || 0}`);

    // Проверяем результат
    const [checkResult] = await sequelize.query(
        "SELECT COUNT(*) as total, replacement_type FROM services GROUP BY replacement_type;"
    );

    console.log('📊 Статистика по типам замены:');
    checkResult.forEach(row => {
        console.log(`   ${row.replacement_type || 'NULL'}: ${row.total} услуг`);
    });

    console.log('🎉 Миграция завершена успешно!');
    process.exit(0);

} catch (error) {
    console.error('❌ Ошибка при добавлении поля:', error);
    process.exit(1);
}
