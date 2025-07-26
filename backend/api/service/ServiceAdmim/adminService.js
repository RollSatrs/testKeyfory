import { Admin } from "../../../database/dbTables.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function addAdmin(telegramId, passwordHash) {
    try{
        if(!telegramId || !passwordHash) throw new Error('Не указан telegram_id или password_hash')

        await Admin.create({ telegramId, password: passwordHash})
        console.log(`✅ Админ создан: ${telegramId}`)
        return
    }catch(err){
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error('Админ с таким Telegram ID уже существует');
        }
        throw new Error('Ошибка сервера')
    }
}

export async function checkAdmin(telegramId) {
    try{
        if(!telegramId) throw new Error('Не указан telegram_id')

        const admin = await Admin.findOne({ where: { telegramId } });
        if (!admin) {
            console.log(`❌ Админ не найден: ${telegramId}`);
            throw new Error('Админ не найден');
        }

        console.log('✅ Админ найден:', admin.telegramId);
        return admin;
    }catch(err){
        if (err.message === 'Админ не найден') {
            throw err;
        }
        throw new Error('Ошибка сервера')
    }
}

export async function login(telegramId, password) {
    try{
        if(!telegramId || !password) throw new Error('Не указан telegram_id или password')

        const admin = await Admin.findOne({ where: { telegramId } });
        if (!admin) throw new Error('Нет такого админа');

        const valid = await bcrypt.compare(password, admin.password)
        if (!valid) throw new Error('Неверный пароль');

        console.log(`✅ Успешный вход для админа: ${telegramId}`);
        return admin;
    }catch(err){
        if (err.message === 'Нет такого админа' || err.message === 'Неверный пароль') {
            throw err;
        }
        throw new Error('Ошибка сервера')
    }
}