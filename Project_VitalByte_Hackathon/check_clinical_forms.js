import { query } from './server/config/db.js';

async function checkClinicalForms() {
    try {
        const result = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clinical_forms'");
        console.log("Columns in clinical_forms:");
        result.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        const data = await query("SELECT * FROM clinical_forms LIMIT 1");
        console.log("\nSample row:");
        console.log(JSON.stringify(data.rows[0], null, 2));
    } catch (err) {
        console.error("Error checking clinical_forms:", err);
    } finally {
        process.exit();
    }
}

checkClinicalForms();
