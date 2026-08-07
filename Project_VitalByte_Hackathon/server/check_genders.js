import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres', host: 'localhost', database: 'hms_db', password: process.env.DB_PASSWORD || 'postgres', port: 5432,
});

async function checkGenders() {
    try {
        const r = await pool.query('SELECT DISTINCT gender FROM patients');
        console.log('Patient Genders in DB:', JSON.stringify(r.rows));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}
checkGenders();
