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

async function seedCatalog() {
    try {
        console.log('--- Seeding Lab Test Catalog ---');

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
                INSERT INTO lab_test_catalog (test_code, test_name, category, gender_restriction)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (test_code) DO UPDATE SET 
                    test_name = EXCLUDED.test_name,
                    category = EXCLUDED.category,
                    gender_restriction = EXCLUDED.gender_restriction;
            `, [code, name, cat, gen]);
            console.log(`✅ Seeded: ${code}`);
        }

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    } finally {
        await pool.end();
    }
}

seedCatalog();
