import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Credentials from checkUsers.js
const pool = new Pool({ connectionString: 'postgres://postgres:asdfghjkl@localhost:5433/hms_db' });

const fixLab = async () => {
    try {
        const email = 'lab@hms.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Checking ${email}...`);

        // Check columns to debugging ID mismatch if any
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Users table columns:', cols.rows.map(r => r.column_name).join(', '));

        const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (res.rows.length === 0) {
            console.log('User NOT found. Creating...');
            // Determine if we use id or user_id based on DB structure
            // But INSERT usually doesn't need ID if SERIAL.
            // We'll use schema assumptions: username, email, password_hash, role, full_name, status

            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, full_name, status) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['lab_tech', email, hashedPassword, 'LAB_ASSISTANT', 'Lab Assistant', 'ACTIVE']
            );
            console.log('Created lab user: lab@hms.com / password123');
        } else {
            console.log(`User found. Status: ${res.rows[0].status}`);
            if (res.rows[0].status !== 'ACTIVE') {
                await pool.query("UPDATE users SET status = 'ACTIVE' WHERE email = $1", [email]);
                console.log('Updated user to ACTIVE.');
            } else {
                console.log('User is already ACTIVE. Resetting password to ensure access...');
                await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [hashedPassword, email]);
                console.log('Password reset to password123');
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
};

fixLab();
