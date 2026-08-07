import bcrypt from 'bcryptjs';
import { query } from './config/db.js';
import pool from './config/db.js';

const seedSimple = async () => {
    try {
        console.log('--- Seeding Simple Lab Assistant ---');
        const email = 'lab@hms.com';
        const rawPassword = 'lab';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        await query(
            `INSERT INTO users (username, password_hash, role, full_name, email, status) 
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE') ON CONFLICT (username) DO NOTHING`,
            ['lab_tech', hashedPassword, 'LAB_ASSISTANT', 'Lab Technician', email]
        );

        console.log('✅ Seeded lab_tech successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
};

seedSimple();
