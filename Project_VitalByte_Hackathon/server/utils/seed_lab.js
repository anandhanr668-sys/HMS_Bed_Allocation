import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

const seedLabAssistant = async () => {
    const user = {
        email: 'lab@hospital.com',
        password: 'lab123',
        role: 'LAB_ASSISTANT',
        name: 'John Lab Tech',
        username: 'lab_john'
    };

    console.log('🌱 Seeding Lab Assistant...');

    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await query(
            `INSERT INTO users (username, password_hash, role, full_name, email, status) 
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE') 
             ON CONFLICT (username) DO NOTHING`,
            [user.username, hashedPassword, user.role, user.name, user.email]
        );
        console.log('✅ Created: LAB_ASSISTANT -> lab@hospital.com');
    } catch (err) {
        console.error('❌ Error seeding lab tech:', err);
    }
    process.exit(0);
};

seedLabAssistant();
