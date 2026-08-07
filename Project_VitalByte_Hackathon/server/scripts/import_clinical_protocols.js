import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const SEMEN_ANALYSIS_SCHEMA = {
    fields: [
        { id: 'sec_id', type: 'section', label: 'PATIENT IDENTIFICATION / SPECIMEN DETAILS' },
        { id: 'row_pat', type: 'row_2', label: 'Partner Identity', columns: ['Male Partner Name', 'Female Partner Name'] },
        { id: 'grid_pat_meta', type: 'grid_4', label: 'Patient Vital Metrics', columns: ['Male Age', 'Female Age', 'Male ID', 'Female ID'] },
        { id: 'grid_specimen', type: 'grid_3', label: 'Specimen Logistics', columns: ['Collection Type', 'Mode of Collection', 'Time of Collection'] },
        { id: 'grid_specimen_2', type: 'grid_3', label: 'Examination Timing', columns: ['Time of Examination', 'Abstinence Period (Days)', 'Complete Collection'] },

        { id: 'sec_macro', type: 'section', label: 'MACROSCOPIC EXAMINATION' },
        { id: 'macro_grid', type: 'grid_3', label: 'Physical Characteristics', columns: ['Volume (ml)', 'Appearance', 'Viscosity'] },
        { id: 'macro_row_2', type: 'row_2', label: 'Chemical Status', columns: ['pH', 'Time of Liquefaction (Mins)'] },

        { id: 'sec_micro', type: 'section', label: 'MICROSCOPIC EXAMINATION' },
        { id: 'micro_grid_1', type: 'grid_3', label: 'Count & Total', columns: ['Sperm Concentration (millions/ml)', 'Total Sperm Number', 'Total Motile Progressive (TMSC)'] },
        { id: 'micro_grid_2', type: 'grid_3', label: 'Motility Grading', columns: ['Rapid Progressive (a) %', 'Slow Progressive (b) %', 'Non-Progressive (c) %'] },
        { id: 'micro_grid_3', type: 'grid_3', label: 'Viability & Content', columns: ['Immotile Sperm %', 'Vitality %', 'Agglutination Status'] },
        { id: 'micro_row_cells', type: 'row_2', label: 'Cellular Components', columns: ['Round Cells / HPF', 'Other Cells / Debris'] },

        { id: 'sec_morph', type: 'section', label: 'MORPHOLOGY (WHO 6th Edition)' },
        { id: 'morph_grid_1', type: 'grid_3', label: 'Structural Analysis', columns: ['Normal Forms %', 'Abnormal Forms %', 'Head Abnormalities %'] },
        { id: 'morph_grid_2', type: 'grid_3', label: 'Segmental Defects', columns: ['Midpiece Abnormalities %', 'Tail Abnormalities %', 'Cytoplasmic Droplets %'] },

        { id: 'sec_ref', type: 'section', label: 'CLINICAL REFERENCE STANDARDS' },
        {
            id: 'ref_info',
            type: 'info',
            label: 'WHO 2021 6th Edition Reference Values',
            placeholder: 'Volume: >= 1.4 ml | pH: >= 7.2 | Conc: >= 16 M/ml | Total Motility: >= 42% | Vitality: >= 54%'
        },
        { id: 'sign', type: 'signature', label: 'Authorized Andrologist Signature' }
    ]
};

const FERTILITY_CLINICAL_SCHEMA = {
    fields: [
        { id: 'sec_fem', type: 'section', label: 'FEMALE PATIENT PROFILE & VITALS' },
        { id: 'f_vitals', type: 'grid_4', label: 'Physical Baseline', columns: ['Height (cm)', 'Weight (kg)', 'BMI', 'Blood Pressure'] },
        { id: 'f_demog', type: 'row_2', label: 'History Duration', columns: ['Married Years', 'Subfertility Years'] },

        { id: 'sec_menstrual', type: 'section', label: 'MENSTRUAL & OBSTETRIC RECALL' },
        { id: 'f_menst', type: 'grid_4', label: 'Cycle Metrics', columns: ['LMP Date', 'Cycle Length', 'Cycle Pattern', 'Pain Grading'] },
        { id: 'f_obs_summary', type: 'grid_4', label: 'G-P-A-L Summary', columns: ['Gravida (G)', 'Para (P)', 'Abortions (A)', 'Living Child (L)'] },
        {
            id: 'obs_table',
            type: 'table',
            label: 'Detailed Obstetric Outcome History',
            columns: ['Outcome', 'Mode of Conception', 'Weeks', 'Mode of Delivery', 'Baby Outcome', 'Complications']
        },

        { id: 'sec_fert_hist', type: 'section', label: 'FERTILITY EVALUATION' },
        { id: 'fert_eval', type: 'row_2', label: 'Infertility Classification', columns: ['Type of Infertility', 'Duration (Years/Months)'] },
        { id: 'complaints', type: 'textarea', label: 'Chief Complaints / Clinical Presentation' },

        { id: 'sec_treatments', type: 'section', label: 'PREVIOUS CLINICAL INTERVENTIONS' },
        {
            id: 'induction_table',
            type: 'table',
            label: 'a) Ovulation Induction History',
            columns: ['Year', 'Drug Used', 'Trigger Mode', 'Outcome']
        },
        {
            id: 'iui_table',
            type: 'table',
            label: 'b) Intrauterine Insemination (IUI)',
            columns: ['Year', 'Drug Used', 'Trigger Mode', 'Outcome']
        },
        {
            id: 'ivf_table',
            type: 'table',
            label: 'c) In-Vitro Fertilization (IVF)',
            columns: ['Year', 'Center', 'Protocol', 'Eggs/Embryos', 'Outcome/Comments']
        },

        { id: 'sec_male', type: 'section', label: 'MALE PARTNER PROFILE' },
        { id: 'm_vitals', type: 'grid_4', label: 'Physical Baseline', columns: ['Height', 'Weight', 'BMI', 'Blood Pressure'] },
        { id: 'm_history', type: 'row_2', label: 'Functional Status', columns: ['Sexual Dysfunction', 'Erectile Problems'] },
        {
            id: 'male_med_table',
            type: 'table',
            label: 'Male Medical/Surgical History',
            columns: ['Condition/Year', 'Surgery/Procedure', 'Notes/Findings']
        },

        { id: 'sec_invest', type: 'section', label: 'RECOMMENDED DIAGNOSTIC ROADMAP' },
        {
            id: 'invest_table',
            type: 'table',
            label: 'Basic Investigations List',
            columns: ['Investigation Name', 'Female (Status)', 'Male (Status)']
        },
        { id: 'advice', type: 'textarea', label: 'Clinical Advice & Next Plan of Action' },
        { id: 'sign_doc', type: 'signature', label: 'Consultant Fertility Specialist' }
    ]
};

async function importProtocols() {
    try {
        console.log('🚀 INITIALIZING HIGH-FIDELITY CLINICAL PROTOCOLS...');

        const templates = [
            {
                id: 'SEMEN_ANALYSIS_PROTOCOL',
                name: 'AS-CAS SEMEN ANALYSIS REPORT (WHO 6TH ED)',
                type: 'LAB_REPORT',
                schema: SEMEN_ANALYSIS_SCHEMA,
                roles: ['DOCTOR', 'LAB_ASSISTANT'],
                location: 'LAB_INVESTIGATION',
                description: 'Professional semen analysis template matching WHO 2021 standards.'
            },
            {
                id: 'FERTILITY_RECON_SHEET',
                name: 'AS-CAS COMPREHENSIVE FERTILITY ASSESSMENT',
                type: 'CASE_SHEET',
                schema: FERTILITY_CLINICAL_SCHEMA,
                roles: ['DOCTOR'],
                location: 'DOCTOR_CONSULTATION',
                description: 'Full-cycle fertility reconnaissance involving detailed female/male history.'
            }
        ];

        for (const t of templates) {
            await pool.query(`
                INSERT INTO form_templates 
                (form_id, form_name, form_type, schema, published_to, workflow_location, deployment_status, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, 'PUBLISHED', true)
                ON CONFLICT (form_id) DO UPDATE SET 
                    form_name = EXCLUDED.form_name,
                    schema = EXCLUDED.schema,
                    workflow_location = EXCLUDED.workflow_location;
            `, [
                t.id,
                t.name,
                t.type,
                JSON.stringify(t.schema),
                JSON.stringify(t.roles),
                t.location
            ]);
            console.log(`✅ Form Synchronized: ${t.name}`);
        }

        console.log('\n✨ CLINICAL PROTOCOLS DEPLOYED SUCCESSFULLY.');
    } catch (err) {
        console.error('❌ PROTOCOL DEPLOYMENT FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

importProtocols();
