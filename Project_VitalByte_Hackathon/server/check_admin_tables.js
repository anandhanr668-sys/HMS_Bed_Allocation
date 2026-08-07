import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function checkTables() {
    const tables = ['patients', 'visits', 'beds', 'protocol_executions', 'audit_logs'];
    for (const table of tables) {
        try {
            const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`Table ${table}: ${res.rows[0].count} rows`);
        } catch (err) {
            console.log(`Table ${table} ERROR: ${err.message}`);
        }
    }
    await pool.end();
}

checkTables();
