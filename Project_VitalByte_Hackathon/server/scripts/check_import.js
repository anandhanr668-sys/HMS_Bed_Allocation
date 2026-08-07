import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        const r = await pool.query('SELECT form_id, form_name FROM form_templates');
        fs.writeFileSync('import_check.json', JSON.stringify(r.rows, null, 2));
    } catch (e) {
        fs.writeFileSync('import_check.json', JSON.stringify({ error: e.message }));
    } finally {
        await pool.end();
    }
}
check();
