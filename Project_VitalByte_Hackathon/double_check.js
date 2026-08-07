import { query } from './server/config/db.js';

async function checkFormSchemas() {
    try {
        const res = await query("SELECT title, form_id FROM form_schemas");
        console.log("FORM_SCHEMAS:", JSON.stringify(res.rows, null, 2));

        const res2 = await query("SELECT form_name, form_code FROM clinical_forms");
        console.log("CLINICAL_FORMS:", JSON.stringify(res2.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkFormSchemas();
