import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

const seedAdmin = async () => {
    const adminEmail = 'admin@hospital.com';
    const plainPassword = 'admin123';

    try {
        console.log('Checking for existing admin...');
        const check = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (check.rows.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await query(
            `INSERT INTO users (username, password_hash, role, full_name, email, status) 
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
            ['admin', hashedPassword, 'ADMIN', 'System Administrator', adminEmail]
        );

        console.log('Admin user created successfully.');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${plainPassword}`);
        process.exit(0);

    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
};

seedAdmin();
