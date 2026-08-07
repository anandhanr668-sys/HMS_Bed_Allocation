import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkLabData() {
    try {
        console.log('--- Checking Laboratory Tables ---');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE 'lab_%';
        `);
        console.log('Tables found:', tables.rows.map(t => t.table_name));

        if (tables.rows.some(t => t.table_name === 'lab_test_catalog')) {
            const catalog = await pool.query('SELECT test_code, test_name FROM lab_test_catalog');
            console.log('Catalog entries:', catalog.rows);
        } else {
            console.log('❌ lab_test_catalog table DOES NOT EXIST');
        }

        const assistants = await pool.query("SELECT id, username, role FROM users WHERE role = 'LAB_ASSISTANT'");
        console.log('Lab Assistants found:', assistants.rows);

    } catch (err) {
        console.error('Error checking data:', err.message);
    } finally {
        await pool.end();
    }
}

checkLabData();
