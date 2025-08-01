import fetch from 'node-fetch';

async function testMaterialsAPI() {
  try {
    console.log('=== ТЕСТИРОВАНИЕ API МАТЕРИАЛОВ ===');

    const response = await fetch('http://localhost:3000/api/materials/admin/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test'
      }
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return;
    }

    const materials = await response.json();
    console.log('Получено материалов:', materials.length);

    materials.forEach(material => {
      console.log(`ID: ${material.id}, Service: ${material.service_id}, Status: ${material.status}, Order: ${material.order_number || 'Не назначен'}`);
    });

  } catch (error) {
    console.error('Ошибка при тестировании API:', error.message);
  }
}

testMaterialsAPI();
