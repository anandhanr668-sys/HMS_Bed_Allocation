import pool from './config/db.js';

async function checkTodayOrders() {
    try {
        const res = await pool.query("SELECT * FROM lab_orders WHERE ordered_at >= CURRENT_DATE ORDER BY ordered_at DESC");
        console.log(`Found ${res.rowCount} orders from today.`);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkTodayOrders();
