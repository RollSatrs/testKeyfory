// Найдем материалы которые действительно были заменены

import { Material, MaterialReplacement, ServiceExecution } from './database/dbTables.js';
import { MATERIAL_STATUS } from './constants/statusConstants.js';
import { Op } from 'sequelize';

async function findRealReplacedMaterials() {
  try {
    console.log('\n🔍 === ПОИСК РЕАЛЬНЫХ ЗАМЕНЕННЫХ МАТЕРИАЛОВ ===\n');

    // 1. Найдем все материалы со статусом "доступен" но с заказом и исполнителем
    const suspiciousMaterials = await Material.findAll({
      where: {
        status: MATERIAL_STATUS.AVAILABLE,
        order_number: { [Op.ne]: null },
        executer_id: { [Op.ne]: null }
      },
      attributes: ['id', 'contents', 'status', 'order_number', 'executer_id', 'service_id'],
      limit: 10
    });

    console.log(`📦 Материалы со статусом "доступен" но с заказом: ${suspiciousMaterials.length}`);

    if (suspiciousMaterials.length > 0) {
      console.log('\n🔍 ПОДОЗРИТЕЛЬНЫЕ МАТЕРИАЛЫ (могут быть заменены):');

      for (const material of suspiciousMaterials) {
        console.log(`\n📦 Материал ID: ${material.id}`);
        console.log(`   Содержимое: "${material.contents}"`);
        console.log(`   Статус в БД: "${material.status}"`);
        console.log(`   Заказ: ${material.order_number}`);
        console.log(`   Исполнитель: ${material.executer_id}`);

        // Проверим есть ли замены для этого материала
        const replacements = await MaterialReplacement.findAll({
          where: { material_id: material.id },
          attributes: ['id', 'status', 'reason', 'created_at'],
          order: [['created_at', 'DESC']]
        });

        if (replacements.length > 0) {
          console.log(`   🔄 Найдено замен: ${replacements.length}`);
          replacements.forEach(r => {
            console.log(`      - Замена ID: ${r.id}, Статус: "${r.status}", Причина: "${r.reason}"`);
          });

          // Если есть завершенная замена - это заменённый материал
          const completedReplacement = replacements.find(r => r.status === 'completed');
          if (completedReplacement) {
            console.log(`   ✅ ЭТОТ МАТЕРИАЛ ЗАМЕНЕН! Должен показываться как "Заменен" в таблице`);
          }
        } else {
          console.log(`   ❌ Замен не найдено`);
        }
      }
    }

    // 2. Найдем все замены с правильными material_id
    const allReplacements = await MaterialReplacement.findAll({
      where: {
        material_id: { [Op.ne]: null }
      },
      include: [{
        model: Material,
        as: 'Material',
        attributes: ['id', 'contents', 'status', 'order_number', 'executer_id']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    console.log(`\n🔄 Всего замен с material_id: ${allReplacements.length}`);

    if (allReplacements.length > 0) {
      console.log('\n📋 ДЕТАЛИ ЗАМЕН:');

      allReplacements.forEach((replacement, index) => {
        console.log(`\n${index + 1}. Замена ID: ${replacement.id}`);
        console.log(`   Материал ID: ${replacement.material_id}`);
        console.log(`   Статус замены: "${replacement.status}"`);
        console.log(`   Причина: "${replacement.reason}"`);

        if (replacement.Material) {
          const material = replacement.Material;
          console.log(`   📦 МАТЕРИАЛ:`);
          console.log(`      Содержимое: "${material.contents}"`);
          console.log(`      Статус в БД: "${material.status}"`);
          console.log(`      Заказ: ${material.order_number || 'нет'}`);
          console.log(`      Исполнитель: ${material.executer_id || 'нет'}`);

          if (replacement.status === 'completed') {
            console.log(`      🎯 ДОЛЖЕН ПОКАЗЫВАТЬСЯ В ТАБЛИЦЕ КАК: "Заменен"`);
            console.log(`      ❌ СЕЙЧАС ПОКАЗЫВАЕТСЯ КАК: "${material.status}"`);
          }
        }
      });
    }

    // 3. Простое решение - создадим массив ID заменённых материалов
    const replacedMaterialIds = allReplacements
      .filter(r => r.status === 'completed' && r.material_id)
      .map(r => r.material_id);

    console.log(`\n📝 ID материалов, которые заменены: [${replacedMaterialIds.join(', ')}]`);
    console.log('\n💡 РЕШЕНИЕ:');
    console.log('1. В backend API добавить поле is_replaced для каждого материала');
    console.log('2. Или в frontend при отображении проверять, есть ли completed replacement');
    console.log('3. Если есть completed replacement - показывать "Заменен" вместо реального статуса');

  } catch (error) {
    console.error('❌ Ошибка поиска замененных материалов:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

findRealReplacedMaterials();
