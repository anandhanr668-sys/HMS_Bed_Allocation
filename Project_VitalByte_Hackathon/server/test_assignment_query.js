import pool from './config/db.js';

async function testQuery() {
    try {
        const labAssistantId = 13; // Using any of the lab assistant IDs from check_lab_users.js
        console.log(`Testing query for Lab Assistant ID: ${labAssistantId}`);

        const sql = `
            SELECT 
                lo.*, 
                p.first_name, p.last_name, p.age, p.gender,
                ltc.test_name, ltc.category,
                u.full_name as ordered_by_name
            FROM lab_orders lo
            JOIN patients p ON lo.patient_id = p.patient_id_str
            JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code
            JOIN users u ON lo.ordered_by = u.id
            WHERE lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')
            ORDER BY 
                CASE WHEN lo.assigned_to = $1 THEN 0 ELSE 1 END,
                CASE lo.priority
                    WHEN 'STAT' THEN 1
                    WHEN 'URGENT' THEN 2
                    WHEN 'ROUTINE' THEN 3
                END,
                lo.ordered_at DESC
        `;

        const res = await pool.query(sql, [labAssistantId]);
        console.log(`Query returned ${res.rowCount} rows.`);
        if (res.rowCount > 0) {
            console.log(JSON.stringify(res.rows, null, 2));
        } else {
            // If 0, let's try to remove joins one by one to see which one breaks
            console.log('\n--- Debugging Joins ---');

            const checkPatients = await pool.query("SELECT COUNT(*) FROM lab_orders lo JOIN patients p ON lo.patient_id = p.patient_id_str WHERE lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')");
            console.log(`Orders with Patient Join: ${checkPatients.rows[0].count}`);

            const checkCatalog = await pool.query("SELECT COUNT(*) FROM lab_orders lo JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code WHERE lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')");
            console.log(`Orders with Catalog Join: ${checkCatalog.rows[0].count}`);

            const checkUsers = await pool.query("SELECT COUNT(*) FROM lab_orders lo JOIN users u ON lo.ordered_by = u.id WHERE lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')");
            console.log(`Orders with User Join: ${checkUsers.rows[0].count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

testQuery();
