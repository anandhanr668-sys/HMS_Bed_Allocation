import { query } from '../../config/db.js';
import { logAction } from '../../utils/auditLogger.js';

/**
 * Get Treatment History for a specific patient
 * @route GET /api/doctor/patients/:id/history
 */
export const getTreatmentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT th.*, u.full_name as author_name 
             FROM doctor_notes th
             LEFT JOIN users u ON th.doctor_id = u.id
             WHERE th.visit_id IN (SELECT visit_id FROM visits WHERE patient_id = $1)
             OR th.patient_id = $1
             ORDER BY th.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching treatment history:', err);
        res.status(500).json({ error: 'Failed to fetch treatment history' });
    }
};

/**
 * Add a new item to treatment history (Case Sheet / Note)
 * @route POST /api/doctor/patients/:id/history
 */
export const addHistoryItem = async (req, res) => {
    const { id: patientId } = req.params;
    const { visitId, type, data, summary, chief_complaint, diagnosis, treatment_plan, prescriptions } = req.body;
    const doctorId = req.user?.id || 1;

    try {
        await query('BEGIN');

        // If no visitId provided, try to find the latest active visit
        let actualVisitId = visitId;
        if (!actualVisitId) {
            const activeVisitRes = await query(
                'SELECT visit_id FROM visits WHERE patient_id = $1 ORDER BY admission_time DESC LIMIT 1',
                [patientId]
            );
            actualVisitId = activeVisitRes.rows[0]?.visit_id;
        }

        const result = await query(
            `INSERT INTO doctor_notes 
            (visit_id, doctor_id, patient_id, note_type, chief_complaint, diagnosis, treatment_plan, prescription_data, clinical_data) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                actualVisitId,
                doctorId,
                patientId,
                type || 'GENERAL',
                chief_complaint || summary,
                diagnosis || type,
                treatment_plan || (typeof data === 'string' ? data : JSON.stringify(data)),
                JSON.stringify(prescriptions || []),
                data ? JSON.stringify(data) : null
            ]
        );

        const newNote = result.rows[0];

        await logAction({
            userId: doctorId,
            action: 'ADD_DOCTOR_NOTE',
            module: 'DOCTOR',
            entityId: actualVisitId || patientId,
            details: { patientId, type: type || 'GENERAL' },
            afterState: newNote,
            ipAddress: req.ip
        });

        await query('COMMIT');
        res.status(201).json(newNote);
    } catch (err) {
        await query('ROLLBACK');
        console.error('Error adding doctor note:', err);
        res.status(500).json({ error: 'Failed to add doctor note' });
    }
};
