import { Material } from './database/dbTables.js';

async function addTestMaterials() {
  try {
    console.log('➕ Добавляем тестовые материалы...');

    const materials = [
      {
        service_id: 145,
        contents: 'TEST-11111-22222-33333-AAAAA',
        status: 'available',
        type_key: 'license',
        source: 'test'
      },
      {
        service_id: 145,
        contents: 'TEST-44444-55555-66666-BBBBB',
        status: 'available',
        type_key: 'license',
        source: 'test'
      },
      {
        service_id: 145,
        contents: 'TEST-77777-88888-99999-CCCCC',
        status: 'available',
        type_key: 'license',
        source: 'test'
      }
    ];

    for (const material of materials) {
      await Material.create(material);
      console.log(`✅ Создан материал: ${material.contents}`);
    }

    console.log('✅ Все тестовые материалы добавлены');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка добавления материалов:', error);
    process.exit(1);
  }
}

addTestMaterials();
