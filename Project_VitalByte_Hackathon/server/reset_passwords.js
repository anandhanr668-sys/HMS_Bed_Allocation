
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function resetPasswords() {
    try {
        const users = [
            { email: 'admin@hospital.com', password: 'admin123' },
            { email: 'doctor@hospital.com', password: 'doctor123' },
            { email: 'nurse@hospital.com', password: 'nurse123' },
            { email: 'frontdesk@hospital.com', password: 'frontdesk123' },
            { email: 'lab@hms.com', password: 'lab' },
            { email: 'lab@hospital.com', password: 'lab' }
        ];

        for (const u of users) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(u.password, salt);

            const res = await pool.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [hashedPassword, u.email]
            );

            if (res.rowCount > 0) {
                console.log(`✅ Updated password for ${u.email}`);
            } else {
                console.log(`❌ User not found: ${u.email}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

resetPasswords();
