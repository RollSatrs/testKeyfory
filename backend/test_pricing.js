import { updateServicePricing } from './api/service/ServiceAdmim/adminServicesService.js';

async function testUpdatePricing() {
  try {
    console.log('=== ТЕСТИРОВАНИЕ ОБНОВЛЕНИЯ ЦЕН ===');

    const serviceId = 64; // Spotify Premium
    const basePrice = 1500;
    const customPricing = [
      { executer_id: 20, custom_price: 1200 },
      { executer_id: 22, custom_price: 1800 }
    ];

    const result = await updateServicePricing(serviceId, basePrice, customPricing);
    console.log('Результат:', result);

  } catch (error) {
    console.error('Ошибка при тестировании updateServicePricing:', error.message);
  }
  process.exit(0);
}

testUpdatePricing();
