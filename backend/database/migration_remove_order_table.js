import { sequelize } from './databaseOn.js';

export const removeOrderTable = async () => {
  console.log('Удаление таблицы orders...');

  try {
    // Проверяем, существует ли таблица
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'orders'
      );
    `);

    if (results[0].exists) {
      // Удаляем таблицу orders
      await sequelize.query('DROP TABLE IF EXISTS orders CASCADE;');
      console.log('Таблица orders успешно удалена');
    } else {
      console.log('Таблица orders не существует');
    }

  } catch (error) {
    console.error('Ошибка при удалении таблицы orders:', error);
    throw error;
  }
};

export default removeOrderTable;
