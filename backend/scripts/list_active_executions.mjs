import { ServiceExecution, Services, Executer } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const statuses = ['in_progress', 'active', 'pending_approval'];
    const execs = await ServiceExecution.findAll({
      where: { status: statuses },
      include: [
        { model: Services, as: 'Service', attributes: ['id', 'name', 'price', 'status'] },
        { model: Executer, as: 'Executer', attributes: ['id', 'name', 'telegram_id'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${execs.length} active ServiceExecution rows (statuses: ${statuses.join(',')})`);
    for (const e of execs) {
      const obj = e.toJSON();
      console.log('---');
      console.log('id:', obj.id);
      console.log('order_number:', obj.order_number);
      console.log('status:', obj.status);
      console.log('price:', obj.price);
      console.log('service_id:', obj.service_id, 'service_name:', obj.Service?.name, 'service_price:', obj.Service?.price, 'service_status:', obj.Service?.status);
      console.log('executer_id:', obj.executer_id, 'executer_name:', obj.Executer?.name);
      console.log('created_at:', obj.created_at);
      console.log('completed_at:', obj.completed_at);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error', err.message);
    process.exit(2);
  }
})();
