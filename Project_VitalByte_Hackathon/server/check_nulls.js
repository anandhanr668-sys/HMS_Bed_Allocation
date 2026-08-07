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

async function checkNotNull() {
    try {
        const r = await pool.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders' AND is_nullable = 'NO'
        `);
        r.rows.forEach(row => console.error(`NOT NULL: ${row.column_name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkNotNull();
