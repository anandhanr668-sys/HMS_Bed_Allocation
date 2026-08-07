import { query } from '../config/db.js';

async function checkData() {
    try {
        const patients = await query('SELECT count(*), min(registered_at), max(registered_at) FROM patients');
        const visits = await query('SELECT count(*), min(check_in_time), max(check_in_time) FROM visits');
        const beds = await query('SELECT count(*) FROM beds');

        console.log('--- PATIENTS ---');
        console.log(patients.rows[0]);

        console.log('\n--- VISITS ---');
        console.log(visits.rows[0]);

        console.log('\n--- BEDS ---');
        console.log(beds.rows[0]);

        // Check some recent records
        const recentPatients = await query('SELECT id, registered_at, full_name FROM patients ORDER BY registered_at DESC LIMIT 5');
        console.log('\n--- RECENT PATIENTS ---');
        console.log(recentPatients.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
