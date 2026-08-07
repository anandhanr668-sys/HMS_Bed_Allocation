import { query } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function checkAdminStats() {
    try {
        console.log('Testing Admin Stats Logic...');

        // Emulate the logic in admin.controller.js
        const whereClausePatient = `registered_at::DATE = CURRENT_DATE`;

        const patientStats = await query(`
            SELECT 
                COUNT(*)::INT as total_patients_all_time,
                COUNT(CASE WHEN ${whereClausePatient} THEN 1 END)::INT as patients_in_range
            FROM patients
        `);

        console.log('API Logic Response:', JSON.stringify(patientStats.rows[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdminStats();
