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

async function listUsers() {
    try {
        const r = await pool.query('SELECT id, username, email, role, status FROM users');
        r.rows.forEach(row => {
            console.log(`ID: ${row.id} | USER: ${row.username} | EMAIL: ${row.email} | ROLE: ${row.role} | STATUS: ${row.status}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}
listUsers();
