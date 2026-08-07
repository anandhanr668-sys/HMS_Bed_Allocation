import { query } from './server/config/db.js';

async function testFetch() {
    try {
        const result = await query(`
            SELECT 
                p.*,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', lo.order_id,
                        'testCode', lo.test_code,
                        'testName', ltc.test_name,
                        'status', lo.status,
                        'priority', lo.priority,
                        'timestamp', lo.ordered_at,
                        'reportId', (SELECT lr.report_id FROM lab_reports lr WHERE lr.order_id = lo.order_id LIMIT 1),
                        'result', (SELECT lr.report_data->>'result' FROM lab_reports lr WHERE lr.order_id = lo.order_id LIMIT 1),
                        'data', (SELECT json_build_object(
                            'volume', sa.volume_ml,
                            'concentration', sa.sperm_concentration,
                            'rapidProgressive', sa.progressive_motility_pct,
                            'normalForms', sa.normal_forms_pct,
                            'tmsc', sa.total_sperm_count,
                            'progressive_motility', sa.progressive_motility_pct,
                            'non_progressive_motility', sa.non_progressive_motility_pct,
                            'total_sperm_count', sa.total_sperm_count,
                            'sperm_concentration', sa.sperm_concentration,
                            'normal_forms', sa.normal_forms_pct,
                            'ph', sa.ph,
                            'appearance', sa.appearance,
                            'liquefaction_time', sa.liquefaction_time_min
                        ) FROM semen_analysis_reports sa WHERE sa.report_id = (SELECT lr.report_id FROM lab_reports lr WHERE lr.order_id = lo.order_id LIMIT 1))
                    ))
                    FROM lab_orders lo
                    LEFT JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code
                    WHERE lo.patient_id = p.patient_id_str)
                , '[]') as investigations,
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
                , '[]') as "treatmentHistory",
                (SELECT json_build_object(
                    'bp_sys', v.bp_systolic,
                    'bp_dia', v.bp_diastolic,
                    'heart_rate', v.bpm,
                    'spO2', v.spo2,
                    'temperature', v.temperature,
                    'respiratory_rate', v.respiratory_rate,
                    'timestamp', v.timestamp
                ) FROM vitals v WHERE v.patient_id = p.patient_id_str ORDER BY v.timestamp DESC LIMIT 1) as vitals,
                COALESCE(
                    (SELECT json_agg(p_item) 
                     FROM (
                       SELECT jsonb_array_elements(prescription_data) as p_item 
                       FROM doctor_notes 
                       WHERE patient_id = p.patient_id_str 
                       OR visit_id IN (SELECT visit_id FROM visits WHERE patient_id = p.patient_id_str)
                     ) sub)
                , '[]') as prescriptions,
                (SELECT v.status FROM visits v WHERE v.patient_id = p.patient_id_str ORDER BY v.check_in_time DESC LIMIT 1) as visit_status,
                (SELECT v.visit_id FROM visits v WHERE v.patient_id = p.patient_id_str ORDER BY v.check_in_time DESC LIMIT 1) as visit_id
            FROM patients p 
            ORDER BY p.registered_at DESC
        `);
        console.log("Success! Count:", result.rows.length);
        if (result.rows.length > 0) {
            console.log("First row keys:", Object.keys(result.rows[0]));
            console.log("Sample row ID:", result.rows[0].patient_id_str);
        }
    } catch (err) {
        console.error("Query FAILED!");
        console.error(err);
    } finally {
        process.exit();
    }
}

testFetch();
