import { Sequelize } from "sequelize";
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Простой путь к общему .env файлу в корне проекта
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Идем на 1 уровень вверх: backend/database -> backend
const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env')

console.log(`📄 [databaseOn.js] Использую .env файл: ${envPath}`)
dotenv.config({ path: envPath })

// Проверяем загрузку переменных
console.log('🔍 [databaseOn.js] Проверка переменных окружения:')
console.log(`  DB_NAME: ${process.env.DB_NAME}`)
console.log(`  DB_USER: ${process.env.DB_USER}`)
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***скрыт***' : 'НЕ ЗАГРУЖЕН'}`)
console.log(`  DB_HOST: ${process.env.DB_HOST}`)
console.log(`  DB_PORT: ${process.env.DB_PORT}`)

export const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    String(process.env.DB_PASSWORD), // Принудительно преобразуем в строку
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT), // Преобразуем порт в число
        dialect: 'postgres',
        logging: false, // Отключает логирование SQL запросов
    }
)
