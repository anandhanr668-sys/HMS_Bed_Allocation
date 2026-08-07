
import { query } from './config/db.js';

const checkPatients = async () => {
    try {
        console.log('--- CHECKING PATIENTS TABLE ---');
        const res = await query(`
            SELECT patient_id_str, first_name, last_name, contact 
            FROM patients 
            LIMIT 10
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

checkPatients();
