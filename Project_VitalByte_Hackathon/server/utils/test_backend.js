import apiClient from '../config/db.js';
import { query } from '../config/db.js';

const testBackend = async () => {
    console.log('🧪 Testing Backend APIs...\n');

    try {
        // Test 1: Check if forms exist in database
        console.log('1️⃣ Checking database for forms...');
        const dbResult = await query('SELECT form_id, title, target_roles FROM form_schemas ORDER BY title');
        console.log(`   ✅ Found ${dbResult.rows.length} forms in database:`);
        dbResult.rows.forEach(form => {
            console.log(`      - ${form.title} (${form.form_id}) [${form.target_roles.join(', ')}]`);
        });

        if (dbResult.rows.length === 0) {
            console.log('\n   ⚠️  No forms found! Run: node utils/seed_forms.js');
            process.exit(1);
        }

        // Test 2: Check users table
        console.log('\n2️⃣ Checking for admin user...');
        const userResult = await query('SELECT id, email, role FROM users WHERE role = $1', ['ADMIN']);
        if (userResult.rows.length > 0) {
            console.log(`   ✅ Admin user exists: ${userResult.rows[0].email}`);
        } else {
            console.log('   ❌ No admin user found! Run: node utils/seed_admin.js');
            process.exit(1);
        }

        console.log('\n✅ All backend checks passed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Make sure backend server is running (npm run dev in /server)');
        console.log('   2. Login with: admin@hospital.com / admin123');
        console.log('   3. Open browser console to see debug logs');
        console.log('   4. Click "Open Existing" in Form Builder');

        process.exit(0);

    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    }
};

testBackend();
