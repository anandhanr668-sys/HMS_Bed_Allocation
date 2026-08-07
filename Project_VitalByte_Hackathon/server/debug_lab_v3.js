import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    try {
        log('--- Checking Laboratory Tables ---');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND (table_name LIKE 'lab_%' OR table_name LIKE 'semen_%');
        `);
        log('Tables found: ' + JSON.stringify(tables.rows, null, 2));

        const assistants = await pool.query("SELECT id, username, role FROM users WHERE role = 'LAB_ASSISTANT'");
        log('Lab Assistants found: ' + JSON.stringify(assistants.rows, null, 2));

    } catch (err) {
        log('Error checking data: ' + err.message);
    } finally {
        fs.writeFileSync('debug_output.txt', output);
        await pool.end();
    }
}

checkLabData();
