import { query } from './server/config/db.js';

async function testRegistration() {
    const patientId = 'TEST-PAT-' + Date.now();
    try {
        const result = await query(
            `INSERT INTO patients (
                patient_id_str, first_name, last_name, age, gender, 
                contact, risk_level, email, blood_type, address, 
                condition, symptoms, date_of_birth
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [
                patientId, 'Test', 'Patient', 30, 'Male',
                '1234567890', 'NORMAL', 'test@example.com', 'O+', 'Test Address',
                'Test Condition', 'Test Symptoms', '1990-01-01'
            ]
        );
        console.log("Patient Inserted:", result.rows[0].patient_id_str);

        const visitResult = await query(
            `INSERT INTO visits (patient_id, status, created_by, visit_type, priority) 
             VALUES ($1, 'AT_NURSE', $2, 'OPD', 'NORMAL') RETURNING *`,
            [patientId, 1]
        );
        console.log("Visit Created:", visitResult.rows[0].visit_id);
    } catch (err) {
        console.error("Test Registration FAILED!");
        console.error(err);
    } finally {
        process.exit();
    }
}

testRegistration();
