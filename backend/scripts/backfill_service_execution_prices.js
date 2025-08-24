import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const envPath = path.join(projectRoot, '.env');

dotenv.config({ path: envPath });

// This script backfills ServiceExecution.price for completed executions where price is null or 0
// and then synchronizes Executer.balance to the computed sum of completed executions.

import { ServiceExecution, Services, ServiceAccess, Executer } from '../database/dbTables.js';
import { sequelize } from '../database/databaseOn.js';

const backfill = async () => {
  try {
    console.log('🔧 Backfill ServiceExecution.price started');

    // Find completed executions with missing or zero price
    const executions = await ServiceExecution.findAll({
      where: {
        status: 'completed',
        // price is null OR price = 0
        // Use raw where clause to allow NULL check
        price: null
      },
      include: [{ model: Services, as: 'Service', attributes: ['id', 'price'] }]
    });

    console.log(`🔎 Found ${executions.length} completed executions with NULL price`);

    const updatedExecuterIds = new Set();

    for (const ex of executions) {
      try {
        const exJson = ex.toJSON ? ex.toJSON() : ex;
        const executerId = exJson.executer_id;
        const serviceId = exJson.service_id;

        // Try to find individual price from ServiceAccess
        let priceToSet = null;
        try {
          const access = await ServiceAccess.findOne({
            where: { executer_id: executerId, service_id: serviceId }
          });
          if (access && typeof access.price !== 'undefined' && access.price !== null) {
            priceToSet = access.price;
          }
        } catch (accErr) {
          console.warn('⚠️ Error fetching ServiceAccess for', executerId, serviceId, accErr.message);
        }

        // Fallback to service price
        if (priceToSet === null) {
          priceToSet = exJson.Service?.price || 0;
        }

        await ex.update({ price: priceToSet });
        updatedExecuterIds.add(executerId);
        console.log(`✅ Updated execution ${exJson.id} (order ${exJson.order_number}) price -> ${priceToSet}₽`);
      } catch (innerErr) {
        console.error('❌ Failed to update execution', ex.id, innerErr.message);
      }
    }

    // Also process executions that have price === 0 (optional)
    const zeroPriceExecs = await ServiceExecution.findAll({
      where: {
        status: 'completed',
        price: 0
      },
      include: [{ model: Services, as: 'Service', attributes: ['id', 'price'] }]
    });

    console.log(`🔎 Found ${zeroPriceExecs.length} completed executions with price == 0`);

    for (const ex of zeroPriceExecs) {
      try {
        const exJson = ex.toJSON ? ex.toJSON() : ex;
        const executerId = exJson.executer_id;
        const serviceId = exJson.service_id;

        // Determine fallback price same as above
        let priceToSet = null;
        try {
          const access = await ServiceAccess.findOne({
            where: { executer_id: executerId, service_id: serviceId }
          });
          if (access && typeof access.price !== 'undefined' && access.price !== null) {
            priceToSet = access.price;
          }
        } catch (accErr) {
          console.warn('⚠️ Error fetching ServiceAccess for', executerId, serviceId, accErr.message);
        }

        if (priceToSet === null) {
          priceToSet = exJson.Service?.price || 0;
        }

        // Only update if priceToSet > 0 to avoid overwriting intentional zeros
        if (priceToSet > 0) {
          await ex.update({ price: priceToSet });
          updatedExecuterIds.add(executerId);
          console.log(`✅ Updated execution ${exJson.id} (order ${exJson.order_number}) price -> ${priceToSet}₽`);
        } else {
          console.log(`⚠️ Skipped execution ${exJson.id} (order ${exJson.order_number}) because fallback price is 0`);
        }
      } catch (innerErr) {
        console.error('❌ Failed to update execution', ex.id, innerErr.message);
      }
    }

    // Recompute and sync balance for affected executers
    for (const executerId of updatedExecuterIds) {
      try {
        const sum = await ServiceExecution.sum('price', {
          where: { executer_id: executerId, status: 'completed' }
        });
        const computed = sum || 0;
        const exec = await Executer.findByPk(executerId);
        if (exec) {
          await exec.update({ balance: computed });
          console.log(`🔁 Synced executer ${executerId} balance -> ${computed}₽`);
        }
      } catch (syncErr) {
        console.error('❌ Failed to sync balance for executer', executerId, syncErr.message);
      }
    }

    console.log('✅ Backfill finished');
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  }
};

// Run
(async () => {
  await sequelize.authenticate();
  await backfill();
})();
