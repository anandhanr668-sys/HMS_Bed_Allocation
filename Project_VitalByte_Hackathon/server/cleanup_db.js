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

async function finalCleanup() {
    try {
        console.log('--- Final Database Schema Cleanup ---');

        // Fix lab_reports
        console.log('Cleaning lab_reports...');
        await pool.query(`
            ALTER TABLE lab_reports 
            ALTER COLUMN report_data DROP NOT NULL,
            ALTER COLUMN status SET DEFAULT 'SUBMITTED'
        `);

        // Ensure necessary columns in lab_reports
        const reportCols = await pool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'lab_reports'
        `);
        const reportColNames = reportCols.rows.map(r => r.column_name);

        if (!reportColNames.includes('performed_by')) {
            await pool.query('ALTER TABLE lab_reports ADD COLUMN performed_by INT');
        }

        console.log('✅ Cleanup complete.');
    } catch (err) {
        console.error('❌ Cleanup failed:', err.message);
    } finally {
        await pool.end();
    }
}
finalCleanup();
