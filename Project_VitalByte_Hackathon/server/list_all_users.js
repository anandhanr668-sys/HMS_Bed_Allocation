
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
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function listAllUsers() {
    try {
        const r = await pool.query('SELECT username, email, role, status FROM users');
        console.log('--- ALL USERS ---');
        r.rows.forEach(u => {
            console.log(`User: ${u.username} | Email: ${u.email} | Role: ${u.role} | Status: ${u.status}`);
        });
        console.log('----------------');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listAllUsers();
