import pool from './config/db.js';

async function checkOrders() {
    try {
        const res = await pool.query("SELECT * FROM lab_orders ORDER BY ordered_at DESC LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkOrders();
