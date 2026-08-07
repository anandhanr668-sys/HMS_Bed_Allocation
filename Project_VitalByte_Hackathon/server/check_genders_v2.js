import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkGenders() {
    try {
        const r = await pool.query('SELECT DISTINCT gender FROM patients');
        console.log('Patient Genders in DB:', JSON.stringify(r.rows));

        const catalog = await pool.query('SELECT test_code, gender_restriction FROM lab_test_catalog WHERE test_code = \'SEMEN_ANALYSIS\'');
        console.log('Semen Analysis Restriction:', JSON.stringify(catalog.rows));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}
checkGenders();
