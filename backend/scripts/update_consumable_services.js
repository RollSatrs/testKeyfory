const { sequelize, Services } = await import('../database/dbTables.js');
const { Op } = await import('sequelize');

async function updateConsumableServices() {
    try {
        console.log('Обновляем существующие цифровые услуги...');

        // Список категорий цифровых услуг (расходных)
        const digitalCategories = [
            'Игры', 'Программное обеспечение', 'Образование', 'Развлечения',
            'Музыка', 'Видео и кино', 'Социальные сети', 'Облако и хостинг',
            'Безопасность', 'VPN и прокси', 'Дизайн и графика', 'Разработка',
            'Фриланс', 'Электронные книги', 'Новости и СМИ', 'Почта и коммуникации',
            'Финансы и банки', 'Онлайн-магазины', 'Здоровье и спорт',
            'Мобильные приложения', 'Фото и видео', 'Технологии',
            'Криптовалюты', 'Маркетинг', 'Общение и знакомства'
        ];

        // Находим все услуги с цифровыми категориями
        const digitalServices = await Services.findAll({
            where: {
                category: digitalCategories
            }
        });

        console.log(`Найдено ${digitalServices.length} цифровых услуг`);

        // Обновляем флаг is_consumable для цифровых услуг
        for (const service of digitalServices) {
            await service.update({
                is_consumable: true
            });
            console.log(`✅ Обновлена услуга: "${service.name}" (${service.category}) -> is_consumable: true`);
        }

        // Находим услуги с другими категориями (не цифровыми)
        const nonDigitalServices = await Services.findAll({
            where: {
                category: {
                    [Op.notIn]: digitalCategories
                }
            }
        });

        console.log(`Найдено ${nonDigitalServices.length} не цифровых услуг`);

        // Обновляем флаг is_consumable для не цифровых услуг
        for (const service of nonDigitalServices) {
            await service.update({
                is_consumable: false
            });
            console.log(`✅ Обновлена услуга: "${service.name}" (${service.category}) -> is_consumable: false`);
        }

        console.log('\nИтоговая статистика:');
        const consumableCount = await Services.count({ where: { is_consumable: true } });
        const nonConsumableCount = await Services.count({ where: { is_consumable: false } });

        console.log(`🔸 Расходных услуг (is_consumable: true): ${consumableCount}`);
        console.log(`🔸 Обычных услуг (is_consumable: false): ${nonConsumableCount}`);
        console.log('✅ Все услуги успешно обновлены!');

    } catch (error) {
        console.error('❌ Ошибка при обновлении услуг:', error);
        throw error;
    }
}

updateConsumableServices()
    .then(() => {
        console.log('🎉 Скрипт выполнен успешно!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Ошибка выполнения скрипта:', error);
        process.exit(1);
    });
