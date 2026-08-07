import { query } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function checkPatients() {
    try {
        console.log('Checking Database Time and Counts...');
        const dbTime = await query('SELECT NOW() as now, CURRENT_DATE as today');
        console.log(`DB NOW: ${dbTime.rows[0].now}`);
        console.log(`DB TODAY: ${dbTime.rows[0].today}`);

        const result = await query("SELECT count(*) FROM patients WHERE registered_at::DATE = CURRENT_DATE");
        console.log("TOTAL_TODAY=" + result.rows[0].count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPatients();
