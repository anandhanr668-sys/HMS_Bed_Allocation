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

async function fixOrderIdType() {
    try {
        console.log('--- Fixing order_id Type in lab_orders ---');

        // 1. Change lab_orders.order_id to VARCHAR
        await pool.query('ALTER TABLE lab_orders ALTER COLUMN order_id TYPE VARCHAR(50)');
        console.log('✅ Updated lab_orders.order_id to VARCHAR');

        // 2. Change lab_audit_log.order_id to VARCHAR (just in case)
        await pool.query('ALTER TABLE lab_audit_log ALTER COLUMN order_id TYPE VARCHAR(50)');
        console.log('✅ Updated lab_audit_log.order_id to VARCHAR');

    } catch (err) {
        console.error('❌ Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fixOrderIdType();
