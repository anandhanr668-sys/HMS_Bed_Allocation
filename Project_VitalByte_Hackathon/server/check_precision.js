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

async function checkPrecisions() {
    try {
        const r = await pool.query(`
            SELECT column_name, data_type, numeric_precision, numeric_scale 
            FROM information_schema.columns 
            WHERE table_name = 'semen_analysis_reports' 
            AND (column_name LIKE '%pct%' OR column_name LIKE '%ml%' OR column_name = 'ph')
        `);
        r.rows.forEach(row => {
            console.error(`COL: ${row.column_name} | PRECISION: ${row.numeric_precision} | SCALE: ${row.numeric_scale}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkPrecisions();
