import { query } from './server/config/db.js';

async function inspectDatabase() {
    try {
        console.log("--- TABLE LIST ---");
        const tablesRes = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log(tables.join(', '));

        for (const table of tables) {
            console.log(`\n--- COLUMNS FOR: ${table} ---`);
            const colsRes = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
            colsRes.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
inspectDatabase();
