
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, 'server', '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('DB Config:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_db',
    password: process.env.DB_PASSWORD || 'asdfghjkl',
    port: parseInt(process.env.DB_PORT) || 5433,
});

async function exportUsers() {
    try {
        console.log('Querying users...');
        const r = await pool.query('SELECT username, email, role, status FROM users');
        fs.writeFileSync('users_status.json', JSON.stringify(r.rows, null, 2));
        console.log('✅ Exported', r.rows.length, 'users to users_status.json');
    } catch (err) {
        console.error('Error during export:', err);
    } finally {
        await pool.end();
    }
}

exportUsers();
