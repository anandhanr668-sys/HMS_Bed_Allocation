import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const FERTILITY_CASE_SHEET_SCHEMA = {
    fields: [
        { id: 'sec_1', type: 'section', label: 'FEMALE INFORMATION' },
        { id: 'f_height', type: 'number', label: 'Height (cm)', placeholder: 'cm' },
        { id: 'f_weight', type: 'number', label: 'Weight (kg)', placeholder: 'kg' },
        { id: 'f_bmi', type: 'text', label: 'BMI', placeholder: 'kg/m2' },
        { id: 'f_bp', type: 'text', label: 'Blood Pressure (BP)', placeholder: 'mmHg' },
        { id: 'f_married', type: 'number', label: 'Married Years' },
        { id: 'f_subfertility', type: 'number', label: 'Subfertility Years' },

        { id: 'sec_2', type: 'section', label: 'MENSTRUAL HISTORY' },
        { id: 'f_lmp', type: 'date', label: 'Last Menstrual Period (LMP)' },
        { id: 'f_cycle', type: 'number', label: 'Cycle Length (days)' },
        { id: 'f_pattern', type: 'dropdown', label: 'Cycle Pattern', options: ['Regular', 'Irregular'] },

        { id: 'sec_3', type: 'section', label: 'OBSTETRIC HISTORY' },
        { id: 'obs_g', type: 'number', label: 'Gravida (G)' },
        { id: 'obs_p', type: 'number', label: 'Para (P)' },
        { id: 'obs_a', type: 'number', label: 'Abortions (A)' },
        { id: 'obs_l', type: 'number', label: 'Living child' },

        { id: 'sec_4', type: 'section', label: 'MALE INFORMATION' },
        { id: 'm_height', type: 'number', label: 'Height (cm)' },
        { id: 'm_weight', type: 'number', label: 'Weight (kg)' },
        { id: 'm_bp', type: 'text', label: 'Blood Pressure (BP)' },
        { id: 'm_dysfunction', type: 'checkbox', label: 'Sexual dysfunction' },
        { id: 'm_erectile', type: 'checkbox', label: 'Erectile problem' }
    ]
};

const SEMEN_ANALYSIS_SCHEMA = {
    fields: [
        { id: 'sec_sample', type: 'section', label: 'SAMPLE COLLECTION' },
        { id: 'coll_type', type: 'dropdown', label: 'Sample Collection Type', options: ['Center', 'Home'] },
        { id: 'coll_mode', type: 'text', label: 'Mode of Collection' },
        { id: 'abstinence', type: 'number', label: 'Abstinence Period (Days)' },

        { id: 'sec_macro', type: 'section', label: 'MACROSCOPIC EXAMINATION' },
        { id: 'vol', type: 'number', label: 'Volume (ml)' },
        { id: 'appearance', type: 'text', label: 'Appearance' },
        { id: 'ph', type: 'number', label: 'pH' },
        { id: 'liquefaction', type: 'number', label: 'Time of Liquefaction (Mins)' },

        { id: 'sec_micro', type: 'section', label: 'MICROSCOPIC EXAMINATION' },
        { id: 'conc', type: 'number', label: 'Sperm Concentration (millions/ml)' },
        { id: 'prog', type: 'number', label: 'Progressive Motility (%)' },
        { id: 'non_prog', type: 'number', label: 'Non-Progressive Motility (%)' },
        { id: 'immotile', type: 'number', label: 'Immotile Sperm (%)' },

        { id: 'sec_morp', type: 'section', label: 'MORPHOLOGY' },
        { id: 'normal', type: 'number', label: 'Normal Forms (%)' },
        { id: 'abnormal', type: 'number', label: 'Abnormal Forms (%)' }
    ]
};

async function seedFormTemplates() {
    try {
        console.log('--- Seeding Form Templates into Form Builder ---');

        // 1. Fertility Case Sheet
        await pool.query(`
            INSERT INTO form_templates (form_id, form_name, form_type, schema, published_to, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (form_id) DO UPDATE SET 
                schema = EXCLUDED.schema,
                form_name = EXCLUDED.form_name;
        `, [
            'FERTILITY_CASE_SHEET',
            'Fertility Case Sheet',
            'CASE_SHEET',
            JSON.stringify(FERTILITY_CASE_SHEET_SCHEMA),
            JSON.stringify(['DOCTOR'])
        ]);
        console.log('✅ Fertility Case Sheet seeded.');

        // 2. Semen Analysis Report
        await pool.query(`
            INSERT INTO form_templates (form_id, form_name, form_type, schema, published_to, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (form_id) DO UPDATE SET 
                schema = EXCLUDED.schema,
                form_name = EXCLUDED.form_name;
        `, [
            'SEMEN_ANALYSIS_REPORT',
            'Semen Analysis Report',
            'LAB_REQUEST',
            JSON.stringify(SEMEN_ANALYSIS_SCHEMA),
            JSON.stringify(['DOCTOR', 'LAB_ASSISTANT'])
        ]);
        console.log('✅ Semen Analysis Report seeded.');

        console.log('--- Seeding Complete ---');
    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        await pool.end();
    }
}

seedFormTemplates();
