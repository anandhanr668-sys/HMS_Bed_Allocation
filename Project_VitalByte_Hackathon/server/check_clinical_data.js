import { query } from './config/db.js';

async function checkClinicalForms() {
    try {
        const res = await query('SELECT form_code, form_name FROM clinical_forms');
        console.log('Clinical Forms:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('ERROR checking clinical_forms:', err.message);
        process.exit(1);
    }
}

checkClinicalForms();
