import { ServiceExecution, Services, Executer } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

const executerId = process.argv[2] || 30;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const execs = await ServiceExecution.findAll({
      where: { executer_id: executerId },
      include: [{ model: Services, as: 'Service' }, { model: Executer, as: 'Executer' }],
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${execs.length} ServiceExecution rows for executer ${executerId}`);
    execs.forEach(e => {
      const obj = e.toJSON();
      console.log('---');
      console.log('id:', obj.id);
      console.log('order_number:', obj.order_number);
      console.log('status:', obj.status);
      console.log('price:', obj.price);
      console.log('service_id:', obj.service_id);
      console.log('service.status:', obj.Service?.status);
      console.log('created_at:', obj.created_at);
      console.log('completed_at:', obj.completed_at);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error', err.message);
    process.exit(2);
  }
})();
