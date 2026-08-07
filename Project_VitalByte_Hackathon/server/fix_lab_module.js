import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const SCHEMA = `
-- 1. Lab Test Catalog
CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id SERIAL PRIMARY KEY,
    test_code VARCHAR(50) UNIQUE NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    gender_restriction VARCHAR(10),
    form_schema_id VARCHAR(50),
    turnaround_time_hours INT DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id VARCHAR(50),
    test_code VARCHAR(50) REFERENCES lab_test_catalog(test_code),
    ordered_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    status VARCHAR(30) DEFAULT 'PENDING',
    sample_collected_at TIMESTAMP,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
);

-- 3. Lab Reports
CREATE TABLE IF NOT EXISTS lab_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) REFERENCES lab_orders(order_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    test_code VARCHAR(50) REFERENCES lab_test_catalog(test_code),
    report_data JSONB NOT NULL,
    performed_by INT REFERENCES users(id),
    verified_by INT REFERENCES users(id),
    sample_collection_time TIMESTAMP,
    examination_time TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    is_abnormal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Semen Analysis Specific
CREATE TABLE IF NOT EXISTS semen_analysis_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) REFERENCES lab_reports(report_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    sample_collection_type VARCHAR(50),
    collection_time TIMESTAMP,
    examination_time TIMESTAMP,
    abstinence_period VARCHAR(50),
    volume_ml DECIMAL(5, 2),
    appearance VARCHAR(50),
    viscosity VARCHAR(50),
    ph DECIMAL(3, 1),
    liquefaction_time_min INT,
    sperm_concentration DECIMAL(10, 2),
    total_sperm_count DECIMAL(10, 2),
    progressive_motility_pct DECIMAL(5, 2),
    non_progressive_motility_pct DECIMAL(5, 2),
    immotile_pct DECIMAL(5, 2),
    vitality_pct DECIMAL(5, 2),
    agglutination BOOLEAN,
    pus_cells_hpf VARCHAR(50),
    normal_forms_pct DECIMAL(5, 2),
    head_abnormalities_pct DECIMAL(5, 2),
    midpiece_abnormalities_pct DECIMAL(5, 2),
    tail_abnormalities_pct DECIMAL(5, 2),
    technician_name VARCHAR(100),
    technician_signature TEXT,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Lab Audit Log
CREATE TABLE IF NOT EXISTS lab_audit_log (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50),
    report_id VARCHAR(50),
    action VARCHAR(100),
    performed_by INT REFERENCES users(id),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function fixLabModule() {
    try {
        console.log('--- Fixing Laboratory Module Tables ---');
        await pool.query(SCHEMA);
        console.log('✅ All tables secured.');

        // Seed some fertility tests again just to be safe
        const FERTILITY_TESTS = [
            ['SEMEN_ANALYSIS', 'Semen Analysis', 'ANDROLOGY', 'MALE', 2],
            ['FSH', 'S. FSH', 'BIOCHEMISTRY', 'ALL', 24],
            ['LH', 'S. LH', 'BIOCHEMISTRY', 'ALL', 24],
            ['PROLACTIN', 'S. Prolactin', 'BIOCHEMISTRY', 'ALL', 24],
            ['TSH', 'S. TSH', 'BIOCHEMISTRY', 'ALL', 24],
            ['AMH', 'S. AMH', 'BIOCHEMISTRY', 'ALL', 48],
            ['HSG', 'HSG', 'RADIOLOGY', 'FEMALE', 24],
            ['FOLLICULAR_STUDY', 'Follicular Study', 'RADIOLOGY', 'FEMALE', 2]
        ];

        for (const [code, name, cat, gen, tat] of FERTILITY_TESTS) {
            await pool.query(`
                INSERT INTO lab_test_catalog (test_code, test_name, category, gender_restriction, turnaround_time_hours)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (test_code) DO NOTHING;
            `, [code, name, cat, gen, tat]);
        }
        console.log('✅ Catalog seeded.');

    } catch (err) {
        console.error('❌ Fix Failed:', err);
    } finally {
        await pool.end();
    }
}

fixLabModule();
