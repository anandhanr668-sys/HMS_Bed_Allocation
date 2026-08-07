import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgres://postgres:asdfghjkl@localhost:5433/hms_db' });

async function checkTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in DB:');
        console.log(res.rows.map(r => r.table_name).sort());
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
