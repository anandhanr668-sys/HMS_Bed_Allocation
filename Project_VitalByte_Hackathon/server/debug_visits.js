
import { query } from './config/db.js';

const checkState = async () => {
    try {
        console.log('--- CHECKING PATIENT VISITS ---');
        const res = await query(`
            SELECT p.first_name, p.patient_id_str, 
            (SELECT status FROM visits v WHERE v.patient_id = p.patient_id_str ORDER BY check_in_time DESC LIMIT 1) as last_visit_status
            FROM patients p
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

checkState();
