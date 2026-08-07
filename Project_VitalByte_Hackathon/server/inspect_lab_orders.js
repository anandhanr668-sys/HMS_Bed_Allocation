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

async function inspectLabOrders() {
    try {
        console.log('--- Detailed Inspection of lab_orders ---');
        const r = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders'
            ORDER BY ordinal_position
        `);
        r.rows.forEach(row => {
            console.log(`COL: ${row.column_name} | TYPE: ${row.data_type} | NULL: ${row.is_nullable} | DEFAULT: ${row.column_default}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
inspectLabOrders();
