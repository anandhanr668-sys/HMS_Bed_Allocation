import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

const seedAllRoles = async () => {
    const users = [
        {
            email: 'doctor@hospital.com',
            password: 'doctor123',
            role: 'DOCTOR',
            name: 'Dr. Sarah Smith',
            username: 'doctor_sarah'
        },
        {
            email: 'nurse@hospital.com',
            password: 'nurse123',
            role: 'NURSE',
            name: 'Nurse John Doe',
            username: 'nurse_john'
        },
        {
            email: 'frontdesk@hospital.com',
            password: 'frontdesk123',
            role: 'FRONT_DESK',
            name: 'Receptionist Jane',
            username: 'front_jane'
        }
    ];

    console.log('🌱 Seeding staff users...');

    for (const user of users) {
        try {
            // Check if exists
            const existing = await query('SELECT * FROM users WHERE email = $1', [user.email]);

            if (existing.rows.length > 0) {
                console.log(`⚠️ User ${user.email} already exists. Skipping.`);
                continue;
            }

            // Create user
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await query(
                `INSERT INTO users (username, password_hash, role, full_name, email, status) 
                 VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
                [user.username, hashedPassword, user.role, user.name, user.email]
            );

            console.log(`✅ Created: ${user.role} -> ${user.email}`);

        } catch (err) {
            console.error(`❌ Error creating ${user.email}:`, err.message);
        }
    }

    console.log('\n✨ Seeding complete! You can now login with these accounts.');
    process.exit(0);
};

seedAllRoles();
