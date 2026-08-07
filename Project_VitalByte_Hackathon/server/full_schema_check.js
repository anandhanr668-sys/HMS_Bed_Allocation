import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function list() {
    const tables = ['lab_orders', 'lab_reports', 'lab_audit_log', 'semen_analysis_reports'];
    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
        r.rows.forEach(c => console.log(`${c.column_name} (${c.data_type})`));
    }
    pool.end();
}
list();
