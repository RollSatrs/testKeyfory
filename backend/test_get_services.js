import { getAllServices } from './api/service/ServiceAdmim/adminServicesService.js';

async function testGetAllServices() {
  try {
    console.log('=== ТЕСТИРОВАНИЕ getAllServices ===');

    const services = await getAllServices();
    console.log('Получено услуг:', services.length);

    services.forEach(service => {
      console.log(`ID: ${service.id}, Name: ${service.name}, Order: ${service.order_number || 'Не назначен'}`);
    });

  } catch (error) {
    console.error('Ошибка при тестировании getAllServices:', error.message);
  }
  process.exit(0);
}

testGetAllServices();
