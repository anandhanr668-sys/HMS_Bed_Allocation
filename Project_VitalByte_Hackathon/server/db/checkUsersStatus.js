import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgres://postgres:asdfghjkl@localhost:5433/hms_db' });
async function check() {
    try {
        const res = await pool.query('SELECT id, email, role, status FROM users');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();
