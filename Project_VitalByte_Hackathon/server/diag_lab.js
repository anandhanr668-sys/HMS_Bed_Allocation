import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function diagnostic() {
    try {
        console.log('--- Lab Assignment Diagnostic ---');

        // 1. Total Pending Orders
        const pending = await pool.query("SELECT COUNT(*) FROM lab_orders WHERE status = 'PENDING'");
        console.log(`Total Pending Orders: ${pending.rows[0].count}`);

        // 2. Check Joins for ALL Lab Orders
        const joinCheck = await pool.query(`
            SELECT 
                lo.order_id,
                lo.patient_id,
                p.patient_id_str as found_patient,
                ltc.test_name as found_test,
                u.username as found_doctor
            FROM lab_orders lo
            LEFT JOIN patients p ON lo.patient_id = p.patient_id_str
            LEFT JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code
            LEFT JOIN users u ON lo.ordered_by = u.id
        `);

        console.log('Join Analysis:');
        joinCheck.rows.forEach(r => {
            console.log(`Order: ${r.order_id} | Patient: ${r.found_patient ? 'OK' : 'MISSING (' + r.patient_id + ')'} | Test: ${r.found_test ? 'OK' : 'MISSING'} | Doctor: ${r.found_doctor ? 'OK' : 'MISSING'}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
diagnostic();
