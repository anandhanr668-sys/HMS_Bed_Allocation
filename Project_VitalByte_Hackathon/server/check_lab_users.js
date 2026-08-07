import pool from './config/db.js';

async function checkUsers() {
    try {
        const res = await pool.query("SELECT id, username, role, full_name FROM users WHERE role = 'LAB_ASSISTANT'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkUsers();
