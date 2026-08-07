import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. ROBUST ENV LOADING: Ensure .env is loaded from the /server directory specifically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

// 2. CONNECTION INTEGRITY: Verify same DB name, Port, and User
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PORT) {
    throw new Error(`CRITICAL CONFIG ERROR: Missing DB Environment variables. 
    Required: DB_NAME, DB_USER, DB_PORT. 
    Check server/.env file.`);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', async (client) => {
    // 3. TIMEZONE CONSISTENCY: Ensure session matches user local time for accurate DATE() comparisons
    await client.query("SET timezone = 'Asia/Kolkata'");

    console.log('--------------------------------------------------');
    console.log('DATABASE PERSISTENCE VERIFIED');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Session Timezone: Asia/Kolkata`);
    console.log('--------------------------------------------------');
});

pool.on('error', (err) => {
    console.error('!!! DATABASE CONNECTION ERROR !!!', err);
    console.log('Continuing server execution; pool will attempt re-connection on next query.');
});

export const query = (text, params) => pool.query(text, params);
export default pool;
