
import { query } from './config/db.js';

const showPatientCredentials = async () => {
    try {
        console.log('\n========================================');
        console.log('PATIENT PORTAL LOGIN CREDENTIALS');
        console.log('========================================\n');

        const res = await query(`
            SELECT patient_id_str, first_name, last_name, contact, age, gender 
            FROM patients 
            ORDER BY registered_at DESC
            LIMIT 5
        `);

        if (res.rows.length === 0) {
            console.log('❌ No patients found in database!');
            console.log('\nPlease register a patient first from Front Desk.\n');
        } else {
            console.log('Use any of these credentials to login:\n');
            res.rows.forEach((p, index) => {
                console.log(`${index + 1}. Patient ID: ${p.patient_id_str}`);
                console.log(`   Name: ${p.first_name} ${p.last_name}`);
                console.log(`   Mobile: ${p.contact || 'NOT SET (any number will work)'}`);
                console.log(`   Age/Gender: ${p.age || 'N/A'}/${p.gender || 'N/A'}`);
                console.log('');
            });

            console.log('========================================');
            console.log('LOGIN INSTRUCTIONS:');
            console.log('========================================');
            console.log('1. Go to: http://localhost:5173/portal/login');
            console.log('2. Enter Patient ID OR Name');
            console.log('3. Enter Mobile Number');
            console.log('4. Click "Access My Records"');
            console.log('========================================\n');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
};

showPatientCredentials();
