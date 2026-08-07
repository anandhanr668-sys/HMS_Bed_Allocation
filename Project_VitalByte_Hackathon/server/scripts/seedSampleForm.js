import pkg from 'pg';
const { Client } = pkg;
// Manually load env since we are running script directly
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const sampleForm = {
    form_id: 'PATIENT_REGISTRATION',
    form_name: 'Patient Registration Form',
    form_type: 'REGISTRATION',
    version: '1.0',
    description: 'Standard registration form for new patients',
    schema: JSON.stringify({
        fields: [
            {
                id: 'field_name',
                type: 'text',
                label: 'Full Name',
                required: true,
                placeholder: 'Enter full name'
            },
            {
                id: 'field_age',
                type: 'number',
                label: 'Age',
                required: true,
                placeholder: 'Enter age'
            },
            {
                id: 'field_gender',
                type: 'dropdown',
                label: 'Gender',
                options: ['Male', 'Female', 'Other'],
                required: true
            },
            {
                id: 'field_dob',
                type: 'date',
                label: 'Date of Birth',
                required: true
            },
            {
                id: 'field_contact',
                type: 'text',
                label: 'Contact Number',
                required: true,
                placeholder: '+91...'
            }
        ]
    }),
    ui_config: JSON.stringify({ theme: 'blue' }),
    published_to: JSON.stringify(['FRONT_DESK', 'DOCTOR']),
    is_active: true
};

async function seed() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        // Check if exists
        const check = await client.query('SELECT * FROM form_templates WHERE form_id = $1', [sampleForm.form_id]);

        if (check.rows.length > 0) {
            console.log('⚠️ Sample form already exists.');
        } else {
            console.log('📝 Creating sample form...');
            await client.query(`
                INSERT INTO form_templates 
                (form_id, form_name, form_type, version, schema, ui_config, published_to, is_active, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
            `, [
                sampleForm.form_id,
                sampleForm.form_name,
                sampleForm.form_type,
                sampleForm.version,
                sampleForm.schema,
                sampleForm.ui_config,
                sampleForm.published_to,
                sampleForm.is_active
            ]);
            console.log('✅ Sample form "Patient Registration" inserted!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

seed();
