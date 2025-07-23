import { Admin } from './dbTables.js';
import bcrypt from 'bcrypt';

// Функция только для создания первого админа, если его нет
export async function seedDatabase() {
    try {
        console.log('🌱 Проверка наличия администратора...');

        // Создаем только первого админа, если его нет
        const adminExists = await Admin.findOne({ where: { telegramId: '123456789' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await Admin.create({
                telegramId: '123456789',
                password: hashedPassword
            });
            console.log('✅ Админ создан (telegramId: 123456789, password: admin123)');
        } else {
            console.log('✅ Админ уже существует');
        }

        // Больше никаких тестовых данных не создаём!
        console.log('🎉 База данных готова к работе (без фейковых данных)');
    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
        throw error;
    }
}
