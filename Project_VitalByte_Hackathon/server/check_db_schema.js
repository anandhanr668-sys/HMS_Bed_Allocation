import { query } from './config/db.js';

async function checkSchema() {
    try {
        const tables = ['patients', 'visits', 'beds', 'protocol_executions', 'audit_logs'];
        for (const table of tables) {
            const res = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
            console.log(`Schema for ${table}:`, res.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error('DB ERROR:', err);
        process.exit(1);
    }
}

checkSchema();
