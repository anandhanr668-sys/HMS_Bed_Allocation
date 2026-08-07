
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function listPatients() {
    try {
        const r = await pool.query('SELECT patient_id_str, first_name, last_name, contact FROM patients LIMIT 10');
        console.log('--- PATIENTS ---');
        r.rows.forEach(p => {
            console.log(`ID: ${p.patient_id_str} | Name: ${p.first_name} ${p.last_name} | Contact: ${p.contact}`);
        });
        console.log('----------------');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listPatients();
