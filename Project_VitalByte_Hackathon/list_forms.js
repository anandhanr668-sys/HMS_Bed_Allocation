import { query } from './server/config/db.js';

async function listAllRows() {
    try {
        const res = await query("SELECT form_code, form_name FROM clinical_forms");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
listAllRows();
