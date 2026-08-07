import pool from './config/db.js';

async function seedCatalog() {
    try {
        console.log('Seeding lab_test_catalog...');

        // Add SEMEN_ANALYSIS if not exists (it should exist but let's be safe)
        await pool.query(`
            INSERT INTO lab_test_catalog (test_code, test_name, category, gender_restriction, turnaround_time_hours, is_active)
            VALUES ('SEMEN_ANALYSIS', 'Semen Analysis', 'ANDROLOGY', 'MALE', 2, true)
            ON CONFLICT (test_code) DO NOTHING
        `);

        // Add FERTILITY_PROFILE
        await pool.query(`
            INSERT INTO lab_test_catalog (test_code, test_name, category, gender_restriction, turnaround_time_hours, is_active)
            VALUES ('FERTILITY_PROFILE', 'Fertility assessment', 'REPRODUCTIVE MEDICINE', 'ALL', 24, true)
            ON CONFLICT (test_code) DO NOTHING
        `);

        console.log('✅ Lab catalog seeded successfully.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seedCatalog();
