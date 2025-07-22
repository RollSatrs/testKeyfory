import { Admin, Services, Material, Order, Performer } from './dbTables.js';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
    try {
        console.log('🌱 Начинаем заполнение базы данных тестовыми данными...');

        // Создаем админа
        const adminExists = await Admin.findOne({ where: { telegramId: '123456789' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await Admin.create({
                telegramId: '123456789',
                password: hashedPassword
            });
            console.log('✅ Админ создан (telegramId: 123456789, password: admin123)');
        }

        // Создаем услуги
        const servicesData = [
            {
                name: 'Xbox Game Pass Ultimate',
                description: 'Подписка на Xbox Game Pass Ultimate - доступ к сотням игр',
                category: 'gaming',
                price: 1299.00,
                required_keys: 1,
                status: 'ACTIVE',
                admin_id: 1
            },
            {
                name: 'Netflix Premium',
                description: 'Премиум подписка Netflix - фильмы и сериалы в 4K',
                category: 'streaming',
                price: 799.00,
                required_keys: 1,
                status: 'ACTIVE',
                admin_id: 1
            },
            {
                name: 'Spotify Premium',
                description: 'Премиум подписка Spotify - музыка без рекламы',
                category: 'streaming',
                price: 299.00,
                required_keys: 1,
                status: 'ACTIVE',
                admin_id: 1
            },
            {
                name: 'Discord Nitro',
                description: 'Discord Nitro - улучшенные функции для общения',
                category: 'social',
                price: 399.00,
                required_keys: 1,
                status: 'ACTIVE',
                admin_id: 1
            },
            {
                name: 'Adobe Creative Cloud',
                description: 'Полный пакет Adobe для творчества и дизайна',
                category: 'software',
                price: 2499.00,
                required_keys: 1,
                status: 'ACTIVE',
                admin_id: 1
            }
        ];

        for (const serviceData of servicesData) {
            const exists = await Services.findOne({ where: { name: serviceData.name } });
            if (!exists) {
                await Services.create(serviceData);
            }
        }
        console.log('✅ Услуги созданы');

        // Создаем исполнителей
        const performersData = [
            {
                telegramId: '111111111',
                rating: 4.8,
                status: 'active'
            },
            {
                telegramId: '222222222',
                rating: 4.5,
                status: 'active'
            },
            {
                telegramId: '333333333',
                rating: 4.2,
                status: 'inactive'
            }
        ];

        for (const performerData of performersData) {
            const exists = await Performer.findOne({ where: { telegramId: performerData.telegramId } });
            if (!exists) {
                await Performer.create(performerData);
            }
        }
        console.log('✅ Исполнители созданы');

        // Создаем материалы (ключи)
        const materialsData = [
            {
                type_key: 'ACTIVATION_KEY',
                contents: 'XBOX-GAME-PASS-KEY-001',
                source: 'Microsoft Store',
                service_id: 1,
                status: 'available'
            },
            {
                type_key: 'ACTIVATION_KEY',
                contents: 'XBOX-GAME-PASS-KEY-002',
                source: 'Microsoft Store',
                service_id: 1,
                status: 'used'
            },
            {
                type_key: 'ACCOUNT_DATA',
                contents: 'NETFLIX-PREMIUM-001',
                source: 'Official Store',
                service_id: 2,
                status: 'available'
            },
            {
                type_key: 'ACTIVATION_KEY',
                contents: 'SPOTIFY-PREMIUM-001',
                source: 'Official Store',
                service_id: 3,
                status: 'reserved'
            },
            {
                type_key: 'LICENSE_KEY',
                contents: 'ADOBE-CC-LICENSE-001',
                source: 'Adobe Store',
                service_id: 5,
                status: 'available'
            }
        ];

        for (const materialData of materialsData) {
            const exists = await Material.findOne({ where: { contents: materialData.contents } });
            if (!exists) {
                await Material.create(materialData);
            }
        }
        console.log('✅ Материалы созданы');

        // Создаем заказы
        const ordersData = [
            {
                customer_telegram_id: '777777777',
                service_id: 1,
                performer_id: 1,
                description: 'Xbox Game Pass Ultimate на 1 месяц',
                contact_info: 'user777@example.com',
                amount: 1299.00,
                status: 'COMPLETED',
                product_keys: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'
            },
            {
                customer_telegram_id: '888888888',
                service_id: 2,
                performer_id: 2,
                description: 'Netflix Premium аккаунт',
                contact_info: 'user888@example.com',
                amount: 799.00,
                status: 'PENDING'
            },
            {
                customer_telegram_id: '999999999',
                service_id: 3,
                performer_id: 1,
                description: 'Spotify Premium на 6 месяцев',
                contact_info: '@user999',
                amount: 299.00,
                status: 'PENDING'
            },
            {
                customer_telegram_id: '555555555',
                service_id: 5,
                performer_id: 2,
                description: 'Adobe Creative Cloud студенческая лицензия',
                contact_info: 'student@university.edu',
                amount: 2499.00,
                status: 'CANCELLED'
            }
        ];

        for (const orderData of ordersData) {
            const exists = await Order.findOne({
                where: {
                    customer_telegram_id: orderData.customer_telegram_id,
                    service_id: orderData.service_id
                }
            });
            if (!exists) {
                await Order.create(orderData);
            }
        }
        console.log('✅ Заказы созданы');

        console.log('🎉 База данных успешно заполнена тестовыми данными!');
        console.log('\n📊 Создано:');
        console.log(`- Админов: ${await Admin.count()}`);
        console.log(`- Услуг: ${await Services.count()}`);
        console.log(`- Исполнителей: ${await Performer.count()}`);
        console.log(`- Материалов: ${await Material.count()}`);
        console.log(`- Заказов: ${await Order.count()}`);

    } catch (error) {
        console.error('❌ Ошибка при заполнении базы данных:', error);
        throw error;
    }
}
