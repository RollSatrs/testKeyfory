import { getAllServices } from '../api/service/ServiceAdmim/adminServicesService.js';
import { sequelize } from '../database/databaseOn.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const services = await getAllServices();
    console.log(`Found ${services.length} services`);
    services.forEach(s => {
      const active = s.active_orders || [];
      if (active.length > 0) {
        console.log('---');
        console.log(`service id: ${s.id}, name: ${s.name}, status: ${s.status}, available_keys: ${s.available_keys}`);
        console.log(`active_orders count: ${active.length}`);
        active.slice(0,5).forEach(a => console.log(` order: ${a.order_number}, status: ${a.status}, executer: ${a.executer_name}`));
      }
    });
    process.exit(0);
  } catch (err) {
    console.error('Error', err.message);
    process.exit(2);
  }
})();
