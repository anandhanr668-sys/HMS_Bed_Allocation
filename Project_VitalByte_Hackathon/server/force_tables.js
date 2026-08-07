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

const TABLES = [
    `CREATE TABLE IF NOT EXISTS lab_test_catalog (
        id SERIAL PRIMARY KEY,
        test_code VARCHAR(50) UNIQUE NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        gender_restriction VARCHAR(10),
        form_schema_id VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lab_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id VARCHAR(50),
        test_code VARCHAR(50),
        ordered_by INT,
        assigned_to INT,
        priority VARCHAR(20) DEFAULT 'ROUTINE',
        status VARCHAR(30) DEFAULT 'PENDING',
        notes TEXT,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lab_reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) UNIQUE NOT NULL,
        order_id VARCHAR(50),
        patient_id VARCHAR(50),
        test_code VARCHAR(50),
        report_data JSONB NOT NULL,
        performed_by INT,
        sample_collection_time TIMESTAMP,
        examination_time TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(30) DEFAULT 'SUBMITTED'
    )`,
    `CREATE TABLE IF NOT EXISTS semen_analysis_reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(50),
        patient_id VARCHAR(50),
        sample_collection_type VARCHAR(50),
        collection_time TIMESTAMP,
        examination_time TIMESTAMP,
        abstinence_period VARCHAR(50),
        volume_ml DECIMAL(10, 2),
        appearance VARCHAR(100),
        viscosity VARCHAR(50),
        ph DECIMAL(10, 2),
        liquefaction_time_min INT,
        sperm_concentration DECIMAL(10, 2),
        total_sperm_count DECIMAL(10, 2),
        progressive_motility_pct DECIMAL(10, 2),
        non_progressive_motility_pct DECIMAL(10, 2),
        immotile_pct DECIMAL(10, 2),
        vitality_pct DECIMAL(10, 2),
        agglutination BOOLEAN,
        pus_cells_hpf VARCHAR(50),
        normal_forms_pct DECIMAL(10, 2),
        head_abnormalities_pct DECIMAL(10, 2),
        midpiece_abnormalities_pct DECIMAL(10, 2),
        tail_abnormalities_pct DECIMAL(10, 2),
        technician_name VARCHAR(100),
        technician_signature TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lab_audit_log (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50),
        action VARCHAR(100),
        performed_by INT,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
];

async function forceUpdateTables() {
    console.log('--- Force Updating Laboratory Tables ---');
    for (const sql of TABLES) {
        try {
            await pool.query(sql);
            console.log('✅ Executed SQL.');
        } catch (err) {
            console.error('❌ SQL Failed:', err.message);
        }
    }

    // Add missing columns if tables already existed
    const columnFixes = [
        ['lab_orders', 'notes', 'TEXT'],
        ['lab_orders', 'completed_at', 'TIMESTAMP'],
        ['lab_reports', 'sample_collection_time', 'TIMESTAMP'],
        ['lab_reports', 'examination_time', 'TIMESTAMP'],
        ['lab_test_catalog', 'form_schema_id', 'VARCHAR(50)']
    ];

    for (const [table, col, type] of columnFixes) {
        try {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`);
            console.log(`✅ Verified ${table}.${col}`);
        } catch (err) {
            console.error(`❌ Alter ${table}.${col} failed:`, err.message);
        }
    }

    await pool.end();
}

forceUpdateTables();
