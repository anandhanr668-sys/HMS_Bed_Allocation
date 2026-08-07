import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './server/config/db.js';

async function simulateLogin() {
    const email = 'admin@hms.com';
    const password = 'admin'; // Based on comment in postgres.session.sql

    try {
        console.log('Searching for user:', email);
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log('User not found');
            return;
        }

        const user = result.rows[0];
        console.log('User found:', user.username);

        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password match:', isMatch);

        console.log('Generating token...');
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            'supersecretkey',
            { expiresIn: '12h' }
        );
        console.log('Token generated');
        process.exit(0);
    } catch (err) {
        console.error('SIMULATION ERROR:', err);
        process.exit(1);
    }
}

simulateLogin();
