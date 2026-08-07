import pool from './config/db.js';

async function checkRecent() {
    try {
        const res = await pool.query("SELECT order_id, patient_id, test_code, status, ordered_at FROM lab_orders ORDER BY ordered_at DESC LIMIT 10");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRecent();
