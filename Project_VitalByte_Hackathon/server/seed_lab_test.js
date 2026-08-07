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

async function seedLab() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role, full_name, status)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
            ON CONFLICT (username) DO UPDATE SET password_hash = $3, status = 'ACTIVE'
        `, ['lab_test', 'testlab@hms.com', hashedPassword, 'LAB_ASSISTANT', 'Lab Test User']);
        console.log('✅ Lab Assistant seeded.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seedLab();
