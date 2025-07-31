import { sequelize } from './databaseOn.js';
import { DataTypes } from 'sequelize';

/**
 * Миграция для добавления поля order_number в таблицы services и material
 */
const addOrderNumberColumns = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log('🔄 Начинаем миграцию: добавление полей order_number...');

    // Проверяем, существует ли поле order_number в таблице services
    const servicesColumns = await queryInterface.describeTable('services');
    if (!servicesColumns.order_number) {
      console.log('📝 Добавляем поле order_number в таблицу services...');
      await queryInterface.addColumn('services', 'order_number', {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Номер заказа для услуги'
      });
      console.log('✅ Поле order_number добавлено в таблицу services');
    } else {
      console.log('ℹ️ Поле order_number уже существует в таблице services');
    }

    // Проверяем, существует ли поле order_number в таблице material
    const materialColumns = await queryInterface.describeTable('material');
    if (!materialColumns.order_number) {
      console.log('📝 Добавляем поле order_number в таблицу material...');
      await queryInterface.addColumn('material', 'order_number', {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Номер заказа для материала'
      });
      console.log('✅ Поле order_number добавлено в таблицу material');
    } else {
      console.log('ℹ️ Поле order_number уже существует в таблице material');
    }

    console.log('🎉 Миграция успешно завершена!');

  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error.message);
    throw error;
  }
};

// Запуск миграции, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  addOrderNumberColumns()
    .then(() => {
      console.log('✅ Миграция выполнена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    });
}

export { addOrderNumberColumns };
