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

const FERTILITY_TESTS = [
    ['SEMEN_ANALYSIS', 'Semen Analysis', 'ANDROLOGY', 'MALE', 2],
    ['FSH', 'S. FSH (Follicle Stimulating Hormone)', 'BIOCHEMISTRY', 'ALL', 24],
    ['LH', 'S. LH (Luteinizing Hormone)', 'BIOCHEMISTRY', 'ALL', 24],
    ['PROLACTIN', 'S. Prolactin', 'BIOCHEMISTRY', 'ALL', 24],
    ['TSH', 'S. TSH (Thyroid Stimulating Hormone)', 'BIOCHEMISTRY', 'ALL', 24],
    ['AMH', 'S. AMH (Anti-Müllerian Hormone)', 'BIOCHEMISTRY', 'ALL', 48],
    ['HSG', 'Hysterosalpingography', 'RADIOLOGY', 'FEMALE', 24],
    ['FOLLICULAR_STUDY', 'Follicular Study (Serial USG)', 'RADIOLOGY', 'FEMALE', 2]
];

async function setupFertilityLabs() {
    try {
        console.log('--- Setting Up Fertility Lab Catalog ---');

        // Ensure catalog table exists (just in case)
        await pool.query(`
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
        `);

        // Insert missing tests
        for (const [code, name, cat, gen, tat] of FERTILITY_TESTS) {
            await pool.query(`
                INSERT INTO lab_test_catalog (test_code, test_name, category, gender_restriction, turnaround_time_hours)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (test_code) DO UPDATE 
                SET test_name = EXCLUDED.test_name, 
                    category = EXCLUDED.category,
                    gender_restriction = EXCLUDED.gender_restriction;
            `, [code, name, cat, gen, tat]);
            console.log(`✅ Synced test: ${code}`);
        }

        console.log('--- Setup Complete ---');
    } catch (err) {
        console.error('❌ Setup Failed:', err.message);
    } finally {
        await pool.end();
    }
}

setupFertilityLabs();
