import pool from './config/db.js';

async function checkCatalog() {
    try {
        const res = await pool.query("SELECT * FROM lab_test_catalog WHERE test_code IN ('SEMEN_ANALYSIS', 'FERTILITY_PROFILE')");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCatalog();
