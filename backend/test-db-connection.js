import { sequelize } from './database/databaseOn.js'

console.log('🔄 Тестируем подключение к базе данных...')

try {
  await sequelize.authenticate()
  console.log('✅ Подключение к PostgreSQL установлено успешно!')

  // Проверяем, какая база данных используется
  const [results] = await sequelize.query('SELECT current_database() as db_name')
  console.log(`📊 Подключены к базе данных: ${results[0].db_name}`)

  await sequelize.close()
  console.log('🔌 Соединение закрыто')
} catch (error) {
  console.error('❌ Ошибка подключения к базе данных:', error.message)
  console.error('🔍 Детали ошибки:', error.original?.message || error.parent?.message || 'Нет дополнительных деталей')
}
