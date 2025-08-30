// Скрипт для добавления нового админа
import { Admin } from './database/dbTables.js';
import bcrypt from 'bcrypt';

async function addNewAdmin() {
  try {
    console.log('\n👤 === ДОБАВЛЕНИЕ НОВОГО АДМИНА ===\n');

    const telegramId = '1165655712';
    const password = '123';

    console.log(`📋 Telegram ID: ${telegramId}`);
    console.log(`🔑 Пароль: ${password}`);

    // Проверяем, существует ли уже такой админ
    const existingAdmin = await Admin.findOne({
      where: { telegramId: telegramId }
    });

    if (existingAdmin) {
      console.log('⚠️ Админ с таким Telegram ID уже существует!');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Telegram ID: ${existingAdmin.telegramId}`);

      // Обновляем пароль существующего админа
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await existingAdmin.update({
        password: hashedPassword
      });

      console.log('✅ Пароль существующего админа обновлен!');
    } else {
      // Создаем нового админа
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      console.log(`🔒 Хэширование пароля...`);

      const newAdmin = await Admin.create({
        telegramId: telegramId,
        password: hashedPassword
      });

      console.log(`✅ Новый админ создан!`);
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Telegram ID: ${newAdmin.telegramId}`);
      console.log(`   Создан: ${newAdmin.createdAt}`);
    }

    // Проверяем общее количество админов
    const totalAdmins = await Admin.count();
    console.log(`\n📊 Всего админов в системе: ${totalAdmins}`);

    // Показываем всех админов (без паролей и проблемных полей)
    const allAdmins = await Admin.findAll({
      attributes: ['id', 'telegramId'],
      order: [['id', 'ASC']]
    });

    console.log('\n👥 Список всех админов:');
    allAdmins.forEach(admin => {
      console.log(`   ID ${admin.id}: Telegram ${admin.telegramId}`);
    });

    console.log('\n✅ Операция завершена успешно!');
    console.log('\n🔐 Теперь вы можете войти в админ панель:');
    console.log(`   Telegram ID: ${telegramId}`);
    console.log(`   Пароль: ${password}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка при добавлении админа:', error);
    process.exit(1);
  }
}

addNewAdmin();
