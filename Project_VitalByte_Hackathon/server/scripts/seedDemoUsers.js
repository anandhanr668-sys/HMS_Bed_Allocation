import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const DEMO_USERS = [
    {
        username: 'admin',
        email: 'admin@hospital.com',
        password: 'admin123',
        role: 'ADMIN',
        fullName: 'System Administrator',
        specialization: null,
        phone: '+1234567890'
    },
    {
        username: 'doctor',
        email: 'doctor@hospital.com',
        password: 'doctor123',
        role: 'DOCTOR',
        fullName: 'Dr. John Smith',
        specialization: 'General Medicine',
        phone: '+1234567891'
    },
    {
        username: 'nurse',
        email: 'nurse@hospital.com',
        password: 'nurse123',
        role: 'NURSE',
        fullName: 'Sarah Johnson',
        specialization: null,
        phone: '+1234567892'
    },
    {
        username: 'frontdesk',
        email: 'frontdesk@hospital.com',
        password: 'frontdesk123',
        role: 'FRONT_DESK',
        fullName: 'Michael Brown',
        specialization: null,
        phone: '+1234567893'
    }
];

async function seedDemoUsers() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        for (const user of DEMO_USERS) {
            console.log(`\n📝 Creating user: ${user.email}`);

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(user.password, salt);

            // Insert or update user
            const query = `
                INSERT INTO users (username, email, password_hash, role, full_name, status, specialization, phone_number)
                VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7)
                ON CONFLICT (email) 
                DO UPDATE SET
                    username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    role = EXCLUDED.role,
                    full_name = EXCLUDED.full_name,
                    status = EXCLUDED.status,
                    specialization = EXCLUDED.specialization,
                    phone_number = EXCLUDED.phone_number
                RETURNING id, username, email, role
            `;

            const values = [
                user.username,
                user.email,
                passwordHash,
                user.role,
                user.fullName,
                user.specialization,
                user.phone
            ];

            const result = await client.query(query, values);
            console.log(`✅ User created/updated:`, result.rows[0]);
            console.log(`   Password: ${user.password}`);
        }

        // Verify all users
        console.log('\n📊 All demo users:');
        const allUsers = await client.query(
            `SELECT id, username, email, role, full_name, status 
             FROM users 
             WHERE email LIKE '%@hospital.com' 
             ORDER BY role`
        );
        console.table(allUsers.rows);

        console.log('\n✅ Demo users seeded successfully!');
        console.log('\n🔐 Login credentials:');
        DEMO_USERS.forEach(user => {
            console.log(`   ${user.role.padEnd(15)} | Email: ${user.email.padEnd(25)} | Password: ${user.password}`);
        });

    } catch (error) {
        console.error('❌ Error seeding demo users:', error.message);
        console.error(error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the script
seedDemoUsers();
