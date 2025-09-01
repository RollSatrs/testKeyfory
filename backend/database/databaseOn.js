import { Sequelize } from "sequelize";
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Принудительно очищаем кэш переменных окружения
delete process.env.DB_NAME;
delete process.env.DB_USER;
delete process.env.DB_PASSWORD;
delete process.env.DB_HOST;
delete process.env.DB_PORT;

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
const envPaths = [backendEnv, repoEnv, cwdEnv];

console.log('🔍 [databaseOn.js] Поиск .env файлов:')
for (const envPath of envPaths) {
    console.log(`  Проверяю: ${envPath} - ${fs.existsSync(envPath) ? '✅ НАЙДЕН' : '❌ НЕ НАЙДЕН'}`)
    if (fs.existsSync(envPath) && !selectedEnv) {
        selectedEnv = envPath;
    }
}

if (selectedEnv) {
    console.log(`📄 [databaseOn.js] Принудительно загружаю .env из: ${selectedEnv}`)
    // Принудительная перезагрузка с override: true
    dotenv.config({ path: selectedEnv, override: true })
} else {
    console.warn('⚠️ [databaseOn.js] .env файл не найден в ожидаемых путях!')
    // Попробуем загрузить стандартный .env
    dotenv.config({ override: true });
}

// Проверяем загрузку переменных
console.log('🔍 [databaseOn.js] Проверка переменных окружения ПОСЛЕ загрузки:')
console.log(`  DB_NAME: ${process.env.DB_NAME || 'undefined'}`)
console.log(`  DB_USER: ${process.env.DB_USER || 'undefined'}`)
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***скрыт***' : 'НЕ ЗАГРУЖЕН'}`)
console.log(`  DB_HOST: ${process.env.DB_HOST || 'undefined'}`)
console.log(`  DB_PORT: ${process.env.DB_PORT || 'undefined'}`)

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
