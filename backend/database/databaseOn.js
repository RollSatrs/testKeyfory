import { Sequelize } from "sequelize";
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Try several possible .env locations: backend/.env, repo root .env, process.cwd()/.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Идем на 1 уровень вверх: backend/database -> backend
const backendDir = path.resolve(__dirname, '..')
const backendEnv = path.join(backendDir, '.env')

// Попробуем найти .env в корне репозитория (один уровень выше backend)
const repoRoot = path.resolve(backendDir, '..')
const repoEnv = path.join(repoRoot, '.env')

// Также на всякий случай проверим текущую рабочую директорию
const cwdEnv = path.join(process.cwd(), '.env')

let selectedEnv = null
if (fs.existsSync(backendEnv)) {
    selectedEnv = backendEnv
} else if (fs.existsSync(repoEnv)) {
    selectedEnv = repoEnv
} else if (fs.existsSync(cwdEnv)) {
    selectedEnv = cwdEnv
}

if (selectedEnv) {
    console.log(`📄 [databaseOn.js] Загружаю .env из: ${selectedEnv}`)
    dotenv.config({ path: selectedEnv })
} else {
    console.warn('⚠️ [databaseOn.js] .env файл не найден в ожидаемых путях; переменные окружения могут быть неопределены')
}

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
