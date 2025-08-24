import { ServiceExecution, Executer, Log } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

const orderNumber = process.argv[2] || '123';
const executerId = process.argv[3] || null;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const execs = await ServiceExecution.findAll({
      where: { order_number: orderNumber },
      include: [
        { model: Executer, as: 'Executer', attributes: ['id', 'name', 'balance', 'telegram_id'] }
      ]
    });

    console.log(`Found ${execs.length} ServiceExecution rows for order ${orderNumber}`);
    for (const e of execs) {
      const obj = e.toJSON();
      console.log('---');
      console.log('id:', obj.id);
      console.log('order_number:', obj.order_number);
      console.log('status:', obj.status);
      console.log('price:', obj.price);
      console.log('service_id:', obj.service_id);
      console.log('executer_id:', obj.executer_id);
      console.log('executer_name:', obj.Executer?.name);
      console.log('executer_balance:', obj.Executer?.balance);
      console.log('created_at:', obj.created_at);
      console.log('completed_at:', obj.completed_at);
    }

    if (executerId) {
      const exec = await Executer.findByPk(executerId);
      console.log('\nExecuter details:');
      if (exec) console.log(`id: ${exec.id}, name: ${exec.name}, balance: ${exec.balance}, telegram_id: ${exec.telegram_id}`);
      const logs = await Log.findAll({ where: { user_id: executerId, user_type: 'executer' }, order: [['created_at','DESC']], limit: 10 });
      console.log(`\nLast ${logs.length} logs for executer ${executerId}:`);
      logs.forEach(l => console.log(`${l.created_at} | ${l.action} | ${l.description} | order:${l.order_id}`));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error', err.message);
    process.exit(2);
  }
})();
