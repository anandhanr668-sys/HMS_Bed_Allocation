import bcrypt from 'bcryptjs';
import { query } from './config/db.js';
import pool from './config/db.js';

const seedAdmin = async () => {
    try {
        console.log('--- Seeding Default Admin User ---');

        const email = 'admin@hms.com';
        const rawPassword = 'admin'; // Simple password for initial setup

        // Check if admin already exists
        const checkRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            console.log('✅ Admin user already exists.');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Insert Admin
        await query(
            `INSERT INTO users (username, password_hash, role, full_name, email, status) 
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
            ['admin', hashedPassword, 'ADMIN', 'System Administrator', email]
        );

        console.log(`✅ Admin user created successfully.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}`);

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedAdmin();
