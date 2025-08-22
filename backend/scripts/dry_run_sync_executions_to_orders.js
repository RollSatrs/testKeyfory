#!/usr/bin/env node

/**
 * Dry-run script: attempts to match ServiceExecution rows to Orders and reports potential updates.
 * Does NOT modify the database. Run from project root with node.
 */

import { ServiceExecution, Order } from "../database/dbTables.js";

async function run() {
    console.log('Starting dry-run ServiceExecution -> Order sync');

    const executions = await ServiceExecution.findAll({
        where: { status: ['completed', 'done', 'finished'] },
        order: [['completed_at', 'DESC']]
    });

    console.log(`Loaded ${executions.length} completed executions`);

    let matched = 0;
    let byOrderNumber = 0;
    let byDetailsOrderNumber = 0;

    for (const exec of executions) {
        // Prefer matching by exec.order_number found inside Order.details
        let foundMatch = false;

        if (exec.order_number) {
            // Load recent orders and try to match by details.order_number
            const recent = await Order.findAll({ limit: 200, order: [['created_at', 'DESC']] });
            for (const o of recent) {
                if (!o.details) continue;
                const details = typeof o.details === 'string' ? (() => { try { return JSON.parse(o.details); } catch (e) { return null; } })() : o.details;
                if (!details) continue;
                if (details.order_number && details.order_number.toString() === exec.order_number.toString()) {
                    matched++;
                    byDetailsOrderNumber++;
                    foundMatch = true;
                    console.log(`Match by details.order_number: exec ${exec.id} -> order ${o.id} (details.order_number=${details.order_number})`);
                    break;
                }
            }
        }

        if (!foundMatch) {
            // Could not match this execution
        }
    }

    console.log('Dry-run completed');
    console.log(`Total executions scanned: ${executions.length}`);
    console.log(`Matched total: ${matched}`);
    console.log(` - by order_number: ${byOrderNumber}`);
    console.log(` - by details.order_number: ${byDetailsOrderNumber}`);
}

run().catch(err => {
    console.error('Error during dry-run:', err);
    process.exit(1);
});
