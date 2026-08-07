
import { query } from './config/db.js';
import fs from 'fs';

async function fetchSchema() {
    try {
        const result = await query("SELECT * FROM clinical_forms WHERE form_code = 'SEMEN_ANALYSIS'");
        if (result.rows.length > 0) {
            fs.writeFileSync('schema_dump.json', JSON.stringify(result.rows[0], null, 2));
            console.log("Schema dumped to schema_dump.json");
        } else {
            console.log("Form not found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fetchSchema();
