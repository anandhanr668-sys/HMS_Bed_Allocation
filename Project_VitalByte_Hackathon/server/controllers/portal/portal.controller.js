
import { query } from '../../config/db.js';
import jwt from 'jsonwebtoken';

// Patient Login (Passwordless - using ID and Phone)
export const patientLogin = async (req, res) => {
    const { identifier, mobile } = req.body; // Identifier can be ID or Name (for improved UX)
    console.log(`[AUTH] Patient Portal Login Attempt: ${identifier} + ${mobile}`);

    try {
        // Query by Patient ID OR Name, MUST match Mobile
        // Note: Using ILIKE for Name search flexibility
        const result = await query(
            `SELECT * FROM patients 
             WHERE (patient_id_str = $1 OR first_name ILIKE $1 OR last_name ILIKE $1) 
             AND (contact = $2 OR contact IS NULL)`,
            [identifier, mobile]
        );

        console.log(`[AUTH] Query returned ${result.rows.length} rows`);

        if (result.rows.length === 0) {
            console.log(`[AUTH] No patient found with identifier: ${identifier}`);
            return res.status(401).json({ error: 'Invalid credentials. Please verify your Patient ID/Name and Mobile Number.' });
        }

        // If multiple matches, prefer exact contact match
        let patient = result.rows[0];
        if (result.rows.length > 1) {
            const exactMatch = result.rows.find(p => p.contact === mobile);
            if (exactMatch) patient = exactMatch;
        }

        // If contact is null, update it with the provided mobile
        if (!patient.contact) {
            console.log(`[AUTH] Updating null contact for patient ${patient.patient_id_str}`);
            await query(
                `UPDATE patients SET contact = $1 WHERE patient_id_str = $2`,
                [mobile, patient.patient_id_str]
            );
            patient.contact = mobile;
        }

        // Verify contact matches (if not null)
        if (patient.contact && patient.contact !== mobile) {
            console.log(`[AUTH] Contact mismatch: DB=${patient.contact}, Provided=${mobile}`);
            return res.status(401).json({ error: 'Invalid credentials. Please verify your Patient ID/Name and Mobile Number.' });
        }

        console.log(`[AUTH] Login successful for patient: ${patient.patient_id_str}`);

        // Generate Token
        const token = jwt.sign(
            { id: patient.id, patientId: patient.patient_id_str, role: 'PATIENT' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            patient: {
                id: patient.id,
                patientId: patient.patient_id_str,
                firstName: patient.first_name,
                lastName: patient.last_name,
                age: patient.age,
                gender: patient.gender
            }
        });

    } catch (err) {
        console.error('[AUTH] Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get Patient Dashboard Data (Visits, Reports)
export const getPatientDashboard = async (req, res) => {
    const { patientId } = req.user; // From Token

    try {
        // 1. Fetch Visits
        const visitsRes = await query(
            `SELECT v.*, u.full_name as doctor_name 
             FROM visits v
             LEFT JOIN users u ON v.doctor_id = u.id
             WHERE v.patient_id = $1
             ORDER BY v.check_in_time DESC`,
            [patientId]
        );

        // 2. Fetch Lab Reports
        const labsRes = await query(
            `SELECT lo.*, u.full_name as tech_name
             FROM lab_orders lo
             LEFT JOIN users u ON lo.assigned_technician_id = u.id
             JOIN visits v ON lo.visit_id = v.visit_id
             WHERE v.patient_id = $1 AND lo.status = 'COMPLETED'
             ORDER BY lo.completed_at DESC`,
            [patientId]
        );

        // 3. Fetch Treatment History (Fertility Case Sheet, etc.)
        const treatmentRes = await query(
            `SELECT * FROM treatment_history
             WHERE patient_id = $1
             ORDER BY timestamp DESC`,
            [patientId]
        );

        res.json({
            visits: visitsRes.rows,
            reports: labsRes.rows,
            treatmentHistory: treatmentRes.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};
