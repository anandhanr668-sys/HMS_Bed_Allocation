import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testPort(port) {
    console.log(`Testing Port ${port}...`);
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: port,
        connectionTimeoutMillis: 2000,
    });
    try {
        await client.connect();
        console.log(`Port ${port}: SUCCESS`);
        const res = await client.query('SELECT NOW()');
        console.log(`Port ${port} Time: ${res.rows[0].now}`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`Port ${port}: FAILED (${err.message})`);
        return false;
    }
}

async function run() {
    await testPort(5432);
    await testPort(5433);
}

run();
