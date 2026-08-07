import { query } from './server/config/db.js';

async function testFetch() {
    try {
        const result = await query(`
            SELECT 
                p.*,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'note_id', dn.note_id,
                        'note_type', dn.note_type,
                        'clinical_data', dn.clinical_data,
                        'chief_complaint', dn.chief_complaint,
                        'diagnosis', dn.diagnosis,
                        'treatment_plan', dn.treatment_plan,
                        'timestamp', dn.timestamp,
                        'author_name', u.full_name
                    ) ORDER BY dn.timestamp DESC)
                    FROM doctor_notes dn
                    LEFT JOIN users u ON dn.doctor_id = u.id
                    WHERE dn.patient_id = p.patient_id_str OR dn.visit_id IN (SELECT visit_id FROM visits WHERE patient_id = p.patient_id_str))
                , '[]') as "treatmentHistory"
            FROM patients p 
            LIMIT 1
        `);
        if (result.rows.length > 0) {
            const h = result.rows[0].treatmentHistory;
            console.log("treatmentHistory type:", typeof h);
            console.log("treatmentHistory value:", h);
            console.log("Is array?", Array.isArray(h));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testFetch();
