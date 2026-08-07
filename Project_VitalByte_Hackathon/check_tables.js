import { query } from './server/config/db.js';

async function checkSpecificTables() {
    try {
        const tables = ['form_submissions', 'form_version_history'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkSpecificTables();
