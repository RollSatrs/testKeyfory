const { sequelize, Services } = await import('../database/databaseOn.js');

async function addIsConsumableField() {
    try {
        console.log('Проверяем наличие поля is_consumable в таблице services...');

        // Проверяем, есть ли уже поле is_consumable
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'services' AND COLUMN_NAME = 'is_consumable'
        `);

        if (results.length > 0) {
            console.log('Поле is_consumable уже существует в таблице services');
            return;
        }

        console.log('Добавляем поле is_consumable...');
        await sequelize.query(`
            ALTER TABLE services
            ADD COLUMN is_consumable BOOLEAN DEFAULT FALSE
        `);

        console.log('Поле is_consumable добавлено успешно');

        // Теперь нужно пометить существующие цифровые услуги как расходные
        // Предположим, что цифровые услуги можно определить по категориям
        const digitalCategories = [
            'Игры',
            'Программное обеспечение',
            'Образование',
            'Развлечения',
            'Музыка',
            'Видео и кино',
            'Социальные сети',
            'Облако и хостинг',
            'Безопасность',
            'VPN и прокси',
            'Дизайн и графика',
            'Разработка',
            'Фриланс',
            'Электронные книги',
            'Новости и СМИ',
            'Почта и коммуникации',
            'Финансы и банки',
            'Онлайн-магазины',
            'Здоровье и спорт',
            'Мобильные приложения',
            'Фото и видео',
            'Технологии',
            'Криптовалюты',
            'Маркетинг',
            'Общение и знакомства'
        ];

        console.log('Помечаем существующие цифровые услуги как расходные...');
        const [updated] = await sequelize.query(`
            UPDATE services
            SET is_consumable = TRUE
            WHERE category IN (${digitalCategories.map(() => '?').join(',')})
        `, {
            replacements: digitalCategories
        });

        console.log(`Обновлено ${updated.affectedRows || 0} услуг`);
        console.log('Миграция завершена успешно!');

    } catch (error) {
        console.error('Ошибка при добавлении поля is_consumable:', error);
        throw error;
    }
}

addIsConsumableField()
    .then(() => {
        console.log('Скрипт выполнен успешно');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Ошибка выполнения скрипта:', error);
        process.exit(1);
    });
