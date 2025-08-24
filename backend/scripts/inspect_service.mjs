import { Services } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

const id = process.argv[2] || 101;
(async () => {
  try {
    await sequelize.authenticate();
    const s = await Services.findByPk(id);
    if (!s) {
      console.log('Service not found', id);
      process.exit(0);
    }
    console.log('Service id:', s.id);
    console.log('name:', s.name);
    console.log('price:', s.price);
    console.log('status:', s.status);
    console.log('executer_id:', s.executer_id);
    process.exit(0);
  } catch (e) {
    console.error('Error', e.message);
    process.exit(2);
  }
})();
