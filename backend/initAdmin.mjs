import { Admin } from './database/dbTables.js';
import bcrypt from 'bcrypt';

export async function initializeAdmin() {
    try {
        console.log('🌱 Проверка наличия администратора...');

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
    } catch (error) {
        console.error('❌ Ошибка при инициализации админа:', error);
        throw error;
    }
}
