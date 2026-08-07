import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedDoctor() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role, full_name, status, department, specialization)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 'FERTILITY', 'Reproductive Medicine')
            ON CONFLICT (username) DO UPDATE SET email = $2
        `, ['doctor_ravi', 'ravi@hms.com', hashedPassword, 'DOCTOR', 'Dr. Ravi Sharma']);
        console.log('✅ Doctor Ravi seeded.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seedDoctor();
