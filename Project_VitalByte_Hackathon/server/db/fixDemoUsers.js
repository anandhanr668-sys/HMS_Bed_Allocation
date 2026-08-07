import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgres://postgres:asdfghjkl@localhost:5433/hms_db' });

const fixDemoUsers = async () => {
    try {
        const demoDomain = '%@hms.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Activating all demo users ending with @hms.com...`);

        // 1. Update status to ACTIVE for all demo users
        const updateStatus = await pool.query(
            "UPDATE users SET status = 'ACTIVE' WHERE email LIKE $1 AND status != 'ACTIVE' RETURNING email",
            [demoDomain]
        );

        if (updateStatus.rows.length > 0) {
            console.log('Activated users:', updateStatus.rows.map(r => r.email).join(', '));
        } else {
            console.log('No additional inactive demo users found.');
        }

        // 2. Reset passwords to password123 for all demo users to ensure access
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email LIKE $2",
            [hashedPassword, demoDomain]
        );
        console.log('All demo user passwords reset to: password123');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
};

fixDemoUsers();
