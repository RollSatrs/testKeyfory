import { sequelize } from './databaseOn.js';
import { DataTypes } from 'sequelize';

/**
 * Миграция для добавления поля executer_id в таблицу services
 */
const addExecuterIdToServices = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log('🔄 Начинаем миграцию: добавление поля executer_id в таблицу services...');

    // Проверяем, существует ли поле executer_id в таблице services
    const servicesColumns = await queryInterface.describeTable('services');
    if (!servicesColumns.executer_id) {
      console.log('📝 Добавляем поле executer_id в таблицу services...');
      await queryInterface.addColumn('services', 'executer_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'executers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Назначенный исполнитель услуги'
      });
      console.log('✅ Поле executer_id добавлено в таблицу services');
    } else {
      console.log('ℹ️ Поле executer_id уже существует в таблице services');
    }

    console.log('🎉 Миграция успешно завершена!');

  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error.message);
    throw error;
  }
};

// Запуск миграции, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  addExecuterIdToServices()
    .then(() => {
      console.log('✅ Миграция выполнена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    });
}

export { addExecuterIdToServices };
