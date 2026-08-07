import { query } from '../../config/db.js';
import { logAction } from '../../utils/auditLogger.js';

// Create a new visit for an existing patient
export const createVisit = async (req, res) => {
    const { patientId, doctorId, visitType, priority } = req.body;
    const staffId = req.user?.id || req.body.staffId; // Support both auth and direct body for testing

    try {
        const result = await query(
            `INSERT INTO visits (patient_id, doctor_id, visit_type, priority, status, created_by) 
             VALUES ($1, $2, $3, $4, 'AT_NURSE', $5) 
             RETURNING *`,
            [patientId, doctorId, visitType, priority || 'NORMAL', staffId]
        );

        const newVisit = result.rows[0];

        await logAction({
            userId: staffId,
            action: 'CREATE_VISIT',
            module: 'FRONT_DESK',
            entityId: newVisit.visit_id,
            details: { patientId, doctorId, visitType },
            ipAddress: req.ip
        });

        res.status(201).json(newVisit);
    } catch (err) {
        console.error('Create Visit Error:', err);
        res.status(500).json({ error: 'Failed to create visit' });
    }
};

// Get visits by status (for Nurse/Doctor/Lab queues)
export const getVisitsByStatus = async (req, res) => {
    const { status } = req.query;
    try {
        const result = await query(
            `SELECT v.*, p.first_name, p.last_name, p.gender, p.age 
             FROM visits v
             JOIN patients p ON v.patient_id = p.patient_id_str
             WHERE (v.status = $1 OR $1 IS NULL)
             ORDER BY v.check_in_time DESC`,
            [status]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Visits Error:', err);
        res.status(500).json({ error: 'Failed to fetch visits' });
    }
};

// Nurse: Add vitals and move to doctor
export const submitVitals = async (req, res) => {
    const { visitId, patientId, vitals, notes, consciousnessLevel, riskLevel } = req.body;
    const nurseId = req.user?.id || req.body.nurseId;

    // Map frontend keys to DB columns
    const {
        spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate, respiratoryRate
    } = vitals || {};

    const respRate = respiratory_rate || respiratoryRate;

    try {
        await query('BEGIN');

        // 1. Insert into Vitals Log (Standardized Vitals Table)
        if (patientId) {
            await query(
                `INSERT INTO vitals (patient_id, spo2, bpm, temperature, bp_systolic, bp_diastolic, respiratory_rate, captured_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [patientId, spo2, bpm, temperature, bp_systolic, bp_diastolic, respRate, nurseId]
            );

            // 2. Update Risk Level on Patient if provided
            if (riskLevel) {
                await query(
                    `UPDATE patients SET risk_level = $1 WHERE patient_id_str = $2`,
                    [riskLevel, patientId]
                );
            }
        }

        // 3. Create Nursing Assessment (for notes & record)
        const assessmentResult = await query(
            `INSERT INTO nursing_assessments (visit_id, nurse_id, vitals, notes, consciousness_level) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [visitId, nurseId, JSON.stringify(vitals), notes, consciousnessLevel]
        );

        // 4. Update Visit Workflow Status
        await query(
            `UPDATE visits SET status = 'WAITING_DOCTOR' WHERE visit_id = $1`,
            [visitId]
        );

        await logAction({
            userId: nurseId,
            action: 'SUBMIT_VITALS',
            module: 'NURSE',
            entityId: visitId,
            details: { vitals, notes, status: 'WAITING_DOCTOR' },
            afterState: assessmentResult.rows[0],
            ipAddress: req.ip
        });

        await query('COMMIT');
        res.json({ message: 'Vitals submitted, patient moved to Doctor queue', status: 'WAITING_DOCTOR' });
    } catch (err) {
        await query('ROLLBACK');
        console.error('Submit Vitals Error:', err);
        res.status(500).json({ error: 'Failed to submit vitals' });
    }
};

// Doctor: Add notes and order labs
export const submitDoctorConsultation = async (req, res) => {
    const { visitId, notes, labsOrdered } = req.body;
    const doctorId = req.user?.id || req.body.doctorId;

    try {
        await query('BEGIN');

        const notesResult = await query(
            `INSERT INTO doctor_notes (visit_id, doctor_id, chief_complaint, diagnosis, treatment_plan, prescription_data) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [visitId, doctorId, notes.chief_complaint, notes.diagnosis, notes.treatment_plan, JSON.stringify(notes.prescriptions)]
        );

        if (labsOrdered && labsOrdered.length > 0) {
            for (const lab of labsOrdered) {
                const orderId = `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                await query(
                    `INSERT INTO lab_orders (order_id, visit_id, ordered_by, test_code, is_sensitive, status) 
                     VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
                    [orderId, visitId, doctorId, lab.testCode || lab.test_type, lab.isSensitive || false]
                );
            }
            await query(`UPDATE visits SET status = 'AT_LAB' WHERE visit_id = $1`, [visitId]);
        } else {
            await query(`UPDATE visits SET status = 'BILLING_PENDING' WHERE visit_id = $1`, [visitId]);
        }

        await logAction({
            userId: doctorId,
            action: 'SUBMIT_CONSULTATION',
            module: 'DOCTOR',
            entityId: visitId,
            details: { hasLabs: labsOrdered?.length > 0 },
            afterState: notesResult.rows[0],
            ipAddress: req.ip
        });

        await query('COMMIT');
        res.json({ message: 'Consultation completed' });
    } catch (err) {
        await query('ROLLBACK');
        console.error('Submit Consultation Error:', err);
        res.status(500).json({ error: 'Failed to submit consultation' });
    }
};
