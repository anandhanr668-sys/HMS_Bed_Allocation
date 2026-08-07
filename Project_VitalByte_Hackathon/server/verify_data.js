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
    port: process.env.DB_PORT,
});

async function verifyData() {
    try {
        console.log('--- Database Data Summary ---');

        const tables = ['users', 'patients', 'beds', 'visits', 'lab_orders'];

        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${result.rows[0].count} rows`);

                if (result.rows[0].count > 0) {
                    const orderBy = table === 'patients' ? 'registered_at' : (table === 'lab_orders' ? 'created_at' : 'id');
                    const samples = await pool.query(`SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 1`);
                    console.log(`Latest from ${table}:`, samples.rows[0]);
                }
            } catch (e) {
                console.log(`${table}: Table might not exist or error: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        await pool.end();
    }
}

verifyData();
