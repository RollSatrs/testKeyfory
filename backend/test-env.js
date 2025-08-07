import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Автоматический поиск .env файла
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function findEnvFile() {
  let currentDir = __dirname

  // Идем вверх по директориям пока не найдем .env файл с содержимым
  while (currentDir !== path.parse(currentDir).root) {
    const envPath = path.join(currentDir, '.env')
    if (fs.existsSync(envPath)) {
      // Проверяем, что файл не пустой
      const content = fs.readFileSync(envPath, 'utf8').trim()
      if (content.length > 0) {
        console.log(`📄 Найден .env файл с содержимым: ${envPath}`)
        return envPath
      } else {
        console.log(`⚠️  Найден пустой .env файл: ${envPath}, продолжаем поиск...`)
      }
    }
    currentDir = path.dirname(currentDir)
  }

  // Если не найден, используем корень проекта
  const fallbackPath = path.join(process.cwd(), '.env')
  console.log(`⚠️  .env файл не найден, используем fallback: ${fallbackPath}`)
  return fallbackPath
}

dotenv.config({ path: findEnvFile() })

console.log('=== ТЕСТ ЗАГРУЗКИ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===')
console.log('DB_NAME:', process.env.DB_NAME, '(тип:', typeof process.env.DB_NAME, ')')
console.log('DB_USER:', process.env.DB_USER, '(тип:', typeof process.env.DB_USER, ')')
console.log('DB_PASSWORD:', process.env.DB_PASSWORD, '(тип:', typeof process.env.DB_PASSWORD, ')')
console.log('DB_HOST:', process.env.DB_HOST, '(тип:', typeof process.env.DB_HOST, ')')
console.log('DB_PORT:', process.env.DB_PORT, '(тип:', typeof process.env.DB_PORT, ')')
console.log('PORT:', process.env.PORT, '(тип:', typeof process.env.PORT, ')')

console.log('\n=== ПРОВЕРКА ЗНАЧЕНИЙ ===')
console.log('DB_PASSWORD как строка:', JSON.stringify(process.env.DB_PASSWORD))
console.log('DB_PASSWORD длина:', process.env.DB_PASSWORD?.length)
console.log('DB_PORT как число:', Number(process.env.DB_PORT))

// Проверим, есть ли проблемы с паролем
if (process.env.DB_PASSWORD) {
  console.log('\n=== АНАЛИЗ ПАРОЛЯ ===')
  console.log('Пароль не пустой: ✅')
  console.log('Пароль это строка:', typeof process.env.DB_PASSWORD === 'string' ? '✅' : '❌')
  console.log('Первый символ пароля:', process.env.DB_PASSWORD[0])
  console.log('Начинается с 0:', process.env.DB_PASSWORD.startsWith('0') ? '⚠️ ДА' : 'НЕТ')
} else {
  console.log('❌ DB_PASSWORD не загружен!')
}
