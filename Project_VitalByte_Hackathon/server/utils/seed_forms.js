import { query } from '../config/db.js';

const recreateAndSeed = async () => {
    try {
        console.log('Recreating form_schemas table with correct structure...');

        // Drop and recreate the table
        await query(`DROP TABLE IF EXISTS form_schemas CASCADE;`);
        console.log('✓ Dropped old table');

        await query(`
            CREATE TABLE form_schemas (
                id SERIAL PRIMARY KEY,
                form_id VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                category VARCHAR(50),
                schema_json JSONB NOT NULL,
                ui_config JSONB,
                target_roles TEXT[],
                is_active BOOLEAN DEFAULT TRUE,
                version INT DEFAULT 1,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Created new table with correct schema');

        // Now seed the forms
        const forms = [
            {
                form_id: 'standard_vitals_nurse',
                title: 'Standard Vitals Check',
                description: 'Routine vitals collection for ward nurses.',
                category: 'Clinical',
                target_roles: ['NURSE'],
                schema_json: [
                    { id: 'bp_sys', type: 'number', label: 'BP Systolic', required: true, placeholder: '120' },
                    { id: 'bp_dia', type: 'number', label: 'BP Diastolic', required: true, placeholder: '80' },
                    { id: 'temp', type: 'number', label: 'Temperature (F)', required: true, placeholder: '98.6' },
                    { id: 'spo2', type: 'number', label: 'SpO2 (%)', required: true, placeholder: '98' },
                    { id: 'hr', type: 'number', label: 'Heart Rate (BPM)', required: true, placeholder: '72' },
                    { id: 'notes', type: 'textarea', label: 'Clinical Observations', required: false, placeholder: 'Patient seems stable...' }
                ],
                ui_config: { theme: 'standard' }
            },
            {
                form_id: 'cardio_intake',
                title: 'Cardiology Intake Form',
                description: 'Specialized registration questions for cardiology patients.',
                category: 'Registration',
                target_roles: ['FRONT_DESK', 'DOCTOR'],
                schema_json: [
                    { id: 'firstName', type: 'text', label: 'First Name', required: true },
                    { id: 'lastName', type: 'text', label: 'Last Name', required: true },
                    { id: 'age', type: 'number', label: 'Age', required: true },
                    { id: 'gender', type: 'select', label: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
                    { id: 'contact', type: 'text', label: 'Contact Number', required: true },
                    { id: 'chest_pain', type: 'checkbox', label: 'Currently experiencing chest pain?', required: false },
                    { id: 'shortness_breath', type: 'checkbox', label: 'Shortness of breath?', required: false },
                    { id: 'history', type: 'textarea', label: 'Family History of Heart Disease', required: true },
                    { id: 'current_meds', type: 'textarea', label: 'Current Medications', required: false }
                ],
                ui_config: { theme: 'cardio' }
            },
            {
                form_id: 'doctor_consult_note',
                title: 'General Consultation Note',
                description: 'Standard SOAP note template for doctors.',
                category: 'Clinical',
                target_roles: ['DOCTOR'],
                schema_json: [
                    { id: 'subjective', type: 'textarea', label: 'Subjective (Patient Complaints)', required: true },
                    { id: 'objective', type: 'textarea', label: 'Objective (Clinical Findings)', required: true },
                    { id: 'assessment', type: 'textarea', label: 'Assessment (Diagnosis)', required: true },
                    { id: 'plan', type: 'textarea', label: 'Plan (Treatment)', required: true },
                    { id: 'follow_up', type: 'date', label: 'Follow Up Date', required: false }
                ],
                ui_config: { theme: 'standard' }
            }
        ];

        console.log('\nSeeding default forms...');

        for (const form of forms) {
            try {
                await query(
                    `INSERT INTO form_schemas (form_id, title, description, category, schema_json, ui_config, target_roles, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
                    [form.form_id, form.title, form.description, form.category, JSON.stringify(form.schema_json), JSON.stringify(form.ui_config), form.target_roles]
                );
                console.log(`✓ Saved: ${form.title}`);
            } catch (err) {
                console.error(`✗ Error saving ${form.title}:`, err.message);
            }
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('📋 3 forms are now available in "Open Existing":');
        console.log('   1. Standard Vitals Check (NURSE)');
        console.log('   2. Cardiology Intake Form (FRONT_DESK, DOCTOR)');
        console.log('   3. General Consultation Note (DOCTOR)');
        console.log('\n🎯 You can now test Edit, Delete, and Add operations!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    }
};

recreateAndSeed();
