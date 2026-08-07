import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixSemenTable() {
    try {
        console.log('--- Fixing semen_analysis_reports Table ---');

        const requiredCols = [
            ['report_id', 'VARCHAR(50)'],
            ['patient_id', 'VARCHAR(50)'],
            ['sample_collection_type', 'VARCHAR(50)'],
            ['collection_time', 'TIMESTAMP'],
            ['examination_time', 'TIMESTAMP'],
            ['abstinence_period', 'VARCHAR(50)'],
            ['volume_ml', 'DECIMAL(10,2)'],
            ['appearance', 'VARCHAR(100)'],
            ['viscosity', 'VARCHAR(100)'],
            ['ph', 'DECIMAL(10,2)'],
            ['liquefaction_time_min', 'INT'],
            ['sperm_concentration', 'DECIMAL(10,2)'],
            ['total_sperm_count', 'DECIMAL(10,2)'],
            ['progressive_motility_pct', 'DECIMAL(10,2)'],
            ['non_progressive_motility_pct', 'DECIMAL(10,2)'],
            ['immotile_pct', 'DECIMAL(10,2)'],
            ['vitality_pct', 'DECIMAL(10,2)'],
            ['agglutination', 'BOOLEAN'],
            ['pus_cells_hpf', 'VARCHAR(50)'],
            ['normal_forms_pct', 'DECIMAL(10,2)'],
            ['head_abnormalities_pct', 'DECIMAL(10,2)'],
            ['midpiece_abnormalities_pct', 'DECIMAL(10,2)'],
            ['tail_abnormalities_pct', 'DECIMAL(10,2)'],
            ['technician_name', 'VARCHAR(100)'],
            ['technician_signature', 'TEXT']
        ];

        for (const [name, type] of requiredCols) {
            try {
                await pool.query(`ALTER TABLE semen_analysis_reports ADD COLUMN IF NOT EXISTS ${name} ${type}`);
                console.log(`✅ Verified/Added column: ${name}`);
            } catch (e) {
                console.error(`❌ Error adding ${name}:`, e.message);
            }
        }

        console.log('--- Fix Complete ---');
    } catch (err) {
        console.error('❌ Critical Fix Failure:', err.message);
    } finally {
        await pool.end();
    }
}

fixSemenTable();
