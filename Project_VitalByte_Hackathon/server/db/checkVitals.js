import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgres://postgres:asdfghjkl@localhost:5433/hms_db' });

async function checkVitals() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vitals'");
        console.log('Columns in vitals:');
        console.log(res.rows);
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkVitals();
