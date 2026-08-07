import { query } from '../config/db.js';

const checkUsers = async () => {
    try {
        console.log('🔍 Checking all users in database...');
        const result = await query('SELECT id, username, email, role, status FROM users ORDER BY role');

        if (result.rows.length === 0) {
            console.log('❌ No users found.');
        } else {
            console.table(result.rows);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error checking users:', err);
        process.exit(1);
    }
};

checkUsers();
