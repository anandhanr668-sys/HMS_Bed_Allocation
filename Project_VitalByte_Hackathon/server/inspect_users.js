
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function main() {
    try {
        const r = await pool.query('SELECT id, username, email, role FROM users');
        fs.writeFileSync('all_users_info.json', JSON.stringify(r.rows, null, 2));
        console.log('Saved to all_users_info.json');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
main();
