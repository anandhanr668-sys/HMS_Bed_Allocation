import bcrypt from 'bcryptjs';
import { query } from './config/db.js';
import pool from './config/db.js';

const seedLabAssistant = async () => {
    try {
        console.log('--- Seeding Default Lab Assistant User ---');

        const email = 'lab@hms.com';
        const rawPassword = 'lab'; // Simple password for demo

        // Check if user already exists
        const checkRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            console.log('✅ Lab Assistant user already exists.');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Insert Lab Assistant
        await query(
            `INSERT INTO users (username, password_hash, role, full_name, email, department, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
            ['lab_tech', hashedPassword, 'LAB_ASSISTANT', 'Lab Technician', email, 'Andrology Lab']
        );

        console.log(`✅ Lab Assistant user created successfully.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedLabAssistant();
