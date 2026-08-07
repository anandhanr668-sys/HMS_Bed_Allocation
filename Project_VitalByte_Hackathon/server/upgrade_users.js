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

async function upgradeUsersTable() {
    try {
        console.log('--- Upgrading Users Table ---');

        // Add department and specialization columns
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS department VARCHAR(100),
            ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
        `);

        console.log('✅ Columns added successfully.');

        // Verify again
        const res = await pool.query("SELECT id, username, full_name, role, status, department FROM users WHERE role = 'LAB_ASSISTANT'");
        console.log('Verified Assistants:', JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('❌ Upgrade Failed:', err.message);
    } finally {
        await pool.end();
    }
}

upgradeUsersTable();
