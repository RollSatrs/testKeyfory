import { getAllMaterials } from './api/service/ServiceAdmim/adminMaterialService.js';

async function testGetAllMaterials() {
  try {
    console.log('=== ТЕСТИРОВАНИЕ getAllMaterials ===');

    const materials = await getAllMaterials();
    console.log('Получено материалов:', materials.length);

    materials.forEach(material => {
      console.log(`ID: ${material.id}, Service: ${material.service_id}, Status: ${material.status}, Order: ${material.order_number || 'Не назначен'}`);
    });

  } catch (error) {
    console.error('Ошибка при тестировании getAllMaterials:', error.message);
  }
  process.exit(0);
}

testGetAllMaterials();
