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

async function checkLabReportsCols() {
    try {
        const r = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'lab_reports'
        `);
        console.error(r.rows.map(c => c.column_name).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkLabReportsCols();
