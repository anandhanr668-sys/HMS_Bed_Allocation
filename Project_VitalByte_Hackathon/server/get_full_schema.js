import { query } from './config/db.js';

async function getFullSchema() {
    try {
        const res = await query('SELECT form_code, schema_json FROM clinical_forms WHERE form_code = $1', ['SEMEN_ANALYSIS']);
        console.log(JSON.stringify(res.rows[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

getFullSchema();
