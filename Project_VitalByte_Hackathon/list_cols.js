import { query } from './server/config/db.js';

async function listColumns() {
    try {
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clinical_forms'");
        console.log("COLUMNS:", res.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
listColumns();
