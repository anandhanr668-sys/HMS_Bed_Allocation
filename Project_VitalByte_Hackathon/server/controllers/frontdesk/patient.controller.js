/**import { query } from '../../config/db.js';
import { logAction } from '../../utils/auditLogger.js';

export const getAllPatients = async (req, res) => {
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
        res.json(result.rows);
    } catch (err) {
        console.error('Get all patients error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

export const registerPatient = async (req, res) => {
    const {
        firstName, lastName, age, gender, contact,
        riskLevel = 'NORMAL', email = '', bloodType = 'Unknown',
        address = '', condition = '', symptoms = '', dateOfBirth = null
    } = req.body;

    // PERMANENT FIX: Handle empty age strings which crash Postgres integer columns
    const parsedAge = (age === '' || age === null || age === undefined) ? null : parseInt(age);

    const patientId = `PAT-${Date.now()}`;
    const staffId = req.user?.id || 1;

    console.log(`[DEBUG] Registration Request: ${firstName} ${lastName}, ID: ${patientId}`);

    try {
        await query('BEGIN');

        // Step 1: Execution of INSERT
        const result = await query(
            `INSERT INTO patients (
                patient_id_str, first_name, last_name, age, gender, 
                contact, risk_level, email, blood_type, address, 
                condition, symptoms, date_of_birth
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [
                patientId, firstName, lastName, parsedAge, gender,
                contact, riskLevel, email, bloodType, address,
                condition, symptoms, dateOfBirth
            ]
        );

        if (!result.rows[0]) {
            throw new Error('Database INSERT failed - No row returned.');
        }

        const newPatient = result.rows[0];

        // Step 2.5: AUTO-CREATE VISIT (Queue Entry)
        // Ensure the patient appears in the dashboards immediately with correct priority
        await query(
            `INSERT INTO visits (patient_id, status, created_by, visit_type, priority) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
                patientId,
                'AT_NURSE',
                staffId,
                riskLevel === 'CRITICAL' ? 'EMERGENCY' : 'OPD',
                riskLevel === 'CRITICAL' ? 'CRITICAL' : 'NORMAL'
            ]
        );

        // Step 3: Logging to Audit
        await logAction({
            userId: staffId,
            action: 'REGISTER_PATIENT',
            module: 'FRONT_DESK',
            entityId: patientId,
            details: { name: `${firstName} ${lastName}`, type: riskLevel === 'CRITICAL' ? 'EMERGENCY' : 'STANDARD' },
            afterState: newPatient,
            ipAddress: req.ip
        });

        await query('COMMIT');
        console.log(`[SUCCESS] Registered & Visit Created: ${patientId}`);
        res.status(201).json(newPatient);
    } catch (err) {
        await query('ROLLBACK');
        console.error('!!! REGISTRATION ERROR !!!', err);
        res.status(500).json({
            error: 'Failed to process registration',
            details: err.message
        });
    }
};

export const updatePatientVitals = async (req, res) => {
    const { id } = req.params; // patient_id_str
    const { spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate, riskLevel } = req.body;

    try {
        await query('BEGIN');

        // 1. Insert Vitals Log
        await query(
            `INSERT INTO vitals (patient_id, spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate]
        );

        // 2. Update Risk Level on Patient
        if (riskLevel) {
            await query(
                `UPDATE patients SET risk_level = $1 WHERE patient_id_str = $2`,
                [riskLevel, id]
            );
        }

        await query('COMMIT');

        res.json({ success: true, riskLevel });
    } catch (err) {
        await query('ROLLBACK');
        console.error('Update vitals error:', err);
        res.status(500).json({ error: 'Failed to update vitals' });
    }
};
export const updatePatientStatus = async (req, res) => {
    const { id } = req.params; // patient_id_str
    const { status, allocatedBedId } = req.body;

    try {
        let queryText = 'UPDATE patients SET status = $1';
        const params = [status];

        if (allocatedBedId !== undefined) {
            params.push(allocatedBedId);
            queryText += `, allocated_bed_id = $${params.length}`;
        }

        params.push(id);
        queryText += ` WHERE patient_id_str = $${params.length} RETURNING *`;

        const result = await query(queryText, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
**/
import { query } from '../../config/db.js';
import { logAction } from '../../utils/auditLogger.js';

/* ======================================================
   GET ALL PATIENTS (Safe + Compatible Query)
====================================================== */
export const getAllPatients = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                p.*,

                /* Investigations (Lab Orders) */
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', lo.order_id,
                            'testCode', lo.test_code,
                            'status', lo.status,
                            'priority', lo.priority,
                            'timestamp', lo.ordered_at,
                            'reportId', lr.report_id,
                            'result', lr.report_data->>'result'
                        ))
                        FROM lab_orders lo
                        LEFT JOIN lab_reports lr 
                            ON lr.visit_id = lo.visit_id
                        WHERE lo.patient_id = p.patient_id_str
                    ), '[]'
                ) AS investigations,

                /* Latest Vitals */
                (
                    SELECT json_build_object(
                        'bp_sys', v.bp_systolic,
                        'bp_dia', v.bp_diastolic,
                        'heart_rate', v.bpm,
                        'spO2', v.spo2,
                        'temperature', v.temperature,
                        'respiratory_rate', v.respiratory_rate,
                        'timestamp', v.timestamp
                    )
                    FROM vitals v
                    WHERE v.patient_id = p.patient_id_str
                    ORDER BY v.timestamp DESC
                    LIMIT 1
                ) AS vitals,

                /* Latest Visit Status */
                (
                    SELECT v.status
                    FROM visits v
                    WHERE v.patient_id = p.patient_id_str
                    ORDER BY v.check_in_time DESC
                    LIMIT 1
                ) AS visit_status,

                (
                    SELECT v.visit_id
                    FROM visits v
                    WHERE v.patient_id = p.patient_id_str
                    ORDER BY v.check_in_time DESC
                    LIMIT 1
                ) AS visit_id

            FROM patients p
            ORDER BY p.registered_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Get all patients error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};


/* ======================================================
   REGISTER PATIENT
====================================================== */
export const registerPatient = async (req, res) => {
    const {
        firstName, lastName, age, gender, contact,
        riskLevel = 'NORMAL', email = '', bloodType = 'Unknown',
        address = '', condition = '', symptoms = '', dateOfBirth = null
    } = req.body;

    const parsedAge =
        age === '' || age === null || age === undefined
            ? null
            : parseInt(age);

    const patientId = `PAT-${Date.now()}`;
    const staffId = req.user?.id || 1;

    try {
        await query('BEGIN');

        const result = await query(
            `INSERT INTO patients (
                patient_id_str, first_name, last_name, age, gender,
                contact, risk_level, email, blood_type, address,
                condition, symptoms, date_of_birth
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *`,
            [
                patientId, firstName, lastName, parsedAge, gender,
                contact, riskLevel, email, bloodType, address,
                condition, symptoms, dateOfBirth
            ]
        );

        const newPatient = result.rows[0];

        /* Auto Create Visit */
        await query(
            `INSERT INTO visits (patient_id, status, created_by, visit_type, priority)
             VALUES ($1,$2,$3,$4,$5)`,
            [
                patientId,
                'AT_NURSE',
                staffId,
                riskLevel === 'CRITICAL' ? 'EMERGENCY' : 'OPD',
                riskLevel === 'CRITICAL' ? 'CRITICAL' : 'NORMAL'
            ]
        );

        /* Audit Log */
        await logAction({
            userId: staffId,
            action: 'REGISTER_PATIENT',
            module: 'FRONT_DESK',
            entityId: patientId,
            details: { name: `${firstName} ${lastName}` },
            afterState: newPatient,
            ipAddress: req.ip
        });

        await query('COMMIT');
        res.status(201).json(newPatient);

    } catch (err) {
        await query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
};


/* ======================================================
   UPDATE PATIENT VITALS
====================================================== */
export const updatePatientVitals = async (req, res) => {
    const { id } = req.params;
    const {
        spo2, bpm, temperature,
        bp_systolic, bp_diastolic,
        respiratory_rate, riskLevel
    } = req.body;

    try {
        await query('BEGIN');

        await query(
            `INSERT INTO vitals
            (patient_id, spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate)
            VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [id, spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate]
        );

        if (riskLevel) {
            await query(
                `UPDATE patients SET risk_level=$1 WHERE patient_id_str=$2`,
                [riskLevel, id]
            );
        }

        await query('COMMIT');
        res.json({ success: true });

    } catch (err) {
        await query('ROLLBACK');
        console.error('Vitals update error:', err);
        res.status(500).json({ error: 'Failed to update vitals' });
    }
};


/* ======================================================
   UPDATE PATIENT STATUS
====================================================== */
export const updatePatientStatus = async (req, res) => {
    const { id } = req.params;
    const { status, allocatedBedId } = req.body;

    try {
        let queryText = 'UPDATE patients SET status = $1';
        const params = [status];

        if (allocatedBedId !== undefined) {
            params.push(allocatedBedId);
            queryText += `, allocated_bed_id = $${params.length}`;
        }

        params.push(id);
        queryText += ` WHERE patient_id_str = $${params.length} RETURNING *`;

        const result = await query(queryText, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
