// One-off cleanup script: remove all data except entries in `admins` table.
// Usage: node scripts/clean_db_except_admins.js

import('./database/dbTables.js').then(async (models) => {
  const {
    Admin,
    Log,
    MaterialReplacement,
    ServiceExecution,
    ExecuterEarnings,
    ExecuterPricing,
    ServiceAccess,
    Material,
    Order,
    Services,
    Executer
  } = models;

  const results = [];

  // Deletion order chosen to reduce FK constraint errors: children first
  const deletionSteps = [
    { name: 'logs', model: Log },
    { name: 'material_replacements', model: MaterialReplacement },
    { name: 'service_executions', model: ServiceExecution },
    { name: 'executer_earnings', model: ExecuterEarnings },
    { name: 'executer_pricing', model: ExecuterPricing },
    { name: 'service_access', model: ServiceAccess },
    { name: 'material', model: Material },
    { name: 'orders', model: Order },
    { name: 'services', model: Services },
    { name: 'executers', model: Executer }
  ];

  try {
    console.log('⚠️ Starting cleanup: will DELETE all rows from tables below, but will NOT touch admins table.');
    for (const step of deletionSteps) {
      if (!step.model) {
        console.log(`- Skipping ${step.name}: model not found`);
        continue;
      }
      try {
        const count = await step.model.count();
        if (count === 0) {
          console.log(`- ${step.name}: already empty`);
          results.push({ table: step.name, before: 0, deleted: 0 });
          continue;
        }
        // destroy all rows
        const deleted = await step.model.destroy({ where: {} });
        console.log(`- ${step.name}: deleted approx ${count} rows`);
        results.push({ table: step.name, before: count, deleted: count });
      } catch (err) {
        console.error(`! Failed to clean ${step.name}:`, err.message);
        results.push({ table: step.name, error: err.message });
      }
    }

    // Final summary
    console.log('\n✅ Cleanup finished. Summary:');
    results.forEach(r => console.log(r));

    // Count remaining admins
    try {
      const adminCount = await Admin.count();
      console.log('\n🔒 Admins preserved:', adminCount);
    } catch (e) {
      console.warn('Could not count admins:', e.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}).catch(err=>{ console.error('Import error:', err); process.exit(1); });
