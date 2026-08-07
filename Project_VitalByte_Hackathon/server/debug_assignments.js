import pool from './config/db.js';

async function debugAssignments() {
    try {
        console.log('--- Checking all PENDING lab orders ---');
        const orders = await pool.query("SELECT * FROM lab_orders WHERE status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')");
        console.log(`Found ${orders.rowCount} pending orders.`);

        for (const order of orders.rows) {
            console.log(`\nAnalyzing Order ID: ${order.order_id}`);
            console.log(`Test Code: ${order.test_code}`);
            console.log(`Patient ID: ${order.patient_id}`);
            console.log(`Ordered By: ${order.ordered_by}`);

            // Check Patient
            const patient = await pool.query("SELECT * FROM patients WHERE patient_id_str = $1", [order.patient_id]);
            if (patient.rowCount === 0) {
                console.log(`❌ FAILED: Patient ${order.patient_id} not found in patients table (using patient_id_str).`);
            } else {
                console.log(`✅ Patient found: ${patient.rows[0].first_name} ${patient.rows[0].last_name}`);
            }

            // Check Test Catalog
            const test = await pool.query("SELECT * FROM lab_test_catalog WHERE test_code = $1", [order.test_code]);
            if (test.rowCount === 0) {
                console.log(`❌ FAILED: Test Code ${order.test_code} not found in lab_test_catalog.`);
            } else {
                console.log(`✅ Test found: ${test.rows[0].test_name}`);
            }

            // Check Ordered By User
            const user = await pool.query("SELECT * FROM users WHERE id = $1", [order.ordered_by]);
            if (user.rowCount === 0) {
                console.log(`❌ FAILED: Doctor/User ID ${order.ordered_by} not found in users table.`);
            } else {
                console.log(`✅ Doctor found: ${user.rows[0].full_name}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugAssignments();
