import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
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

async function seedLabTech() {
    try {
        console.log('--- Seeding Lab Assistant ---');
        const salt = await bcrypt.genSalt(10);
        const pass = await bcrypt.hash('lab', salt);

        await pool.query(`
            INSERT INTO users (username, password_hash, role, full_name, email, status)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
            ON CONFLICT (username) DO UPDATE 
            SET status = 'ACTIVE', role = 'LAB_ASSISTANT';
        `, ['lab@hms.com', pass, 'LAB_ASSISTANT', 'John Lab Assistant', 'lab@hms.com']);

        console.log('✅ Lab Assistant lab@hms.com seeded and set to ACTIVE');
    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        await pool.end();
    }
}

seedLabTech();
