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

async function checkColTypes() {
    try {
        const r = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders' AND column_name = 'order_id'
        `);
        console.error('lab_orders.order_id type:', r.rows[0].data_type);

        const r2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'lab_audit_log' AND column_name = 'order_id'
        `);
        console.error('lab_audit_log.order_id type:', r2.rows[0].data_type);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkColTypes();
