import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// PATIENT MONITORING CONTROLLER (READ-ONLY FOR ADMIN)
// Admin Oversight Without Clinical Editing
// ============================================================

/**
 * Get all patients with filters
 */
export const getAllPatients = async (req, res) => {
    try {
        const { status, riskLevel, visitType, period } = req.query;
        
        let queryText = `
            SELECT 
                p.*,
                v.visit_type,
                v.status as visit_status,
                v.check_in_time,
                v.check_out_time,
                b.bed_id_str,
                b.ward_name,
                b.type as bed_type,
                u.full_name as assigned_doctor
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            params.push(status);
            queryText += ` AND p.status = $${params.length}`;
        }
        
        if (riskLevel) {
            params.push(riskLevel);
            queryText += ` AND p.risk_level = $${params.length}`;
        }
        
        if (visitType) {
            params.push(visitType);
            queryText += ` AND v.visit_type = $${params.length}`;
        }
        
        // Period filter (today, this week, this month, this year)
        if (period === 'today') {
            queryText += ` AND p.registered_at >= CURRENT_DATE`;
        } else if (period === 'week') {
            queryText += ` AND p.registered_at >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (period === 'month') {
            queryText += ` AND p.registered_at >= CURRENT_DATE - INTERVAL '30 days'`;
        } else if (period === 'year') {
            queryText += ` AND p.registered_at >= CURRENT_DATE - INTERVAL '365 days'`;
        }
        
        queryText += ' ORDER BY p.registered_at DESC LIMIT 200';
        
        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patients:', err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

/**
 * Get patient by ID (read-only overview)
 */
export const getPatientById = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Get patient basic info
        const patientResult = await query(
            `SELECT 
                p.*,
                b.bed_id_str,
                b.ward_name,
                b.type as bed_type
            FROM patients p
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            WHERE p.patient_id_str = $1`,
            [patientId]
        );
        
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const patient = patientResult.rows[0];
        
        // Get visit history
        const visitsResult = await query(
            `SELECT v.*, u.full_name as doctor_name
            FROM visits v
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE v.patient_id = $1
            ORDER BY v.check_in_time DESC`,
            [patientId]
        );
        
        // Get latest vitals (read-only snapshot)
        const vitalsResult = await query(
            `SELECT v.*, u.full_name as captured_by_name
            FROM vitals v
            LEFT JOIN users u ON v.captured_by = u.id
            WHERE v.patient_id = $1
            ORDER BY v.timestamp DESC
            LIMIT 5`,
            [patientId]
        );
        
        res.json({
            patient,
            visits: visitsResult.rows,
            latestVitals: vitalsResult.rows
        });
    } catch (err) {
        console.error('Error fetching patient details:', err);
        res.status(500).json({ error: 'Failed to fetch patient details' });
    }
};

/**
 * Get patients by category
 */
export const getPatientsByCategory = async (req, res) => {
    try {
        const { category } = req.params; // today, opd, ipd, icu, emergency
        
        let queryText = `
            SELECT 
                p.*,
                v.visit_type,
                v.status as visit_status,
                b.ward_name,
                b.type as bed_type,
                u.full_name as assigned_doctor
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE 1=1
        `;
        
        switch (category) {
            case 'today':
                queryText += ` AND p.registered_at >= CURRENT_DATE`;
                break;
            case 'opd':
                queryText += ` AND v.visit_type = 'OPD'`;
                break;
            case 'ipd':
                queryText += ` AND v.visit_type = 'IPD' AND p.status = 'ADMITTED'`;
                break;
            case 'icu':
                queryText += ` AND b.ward_name LIKE '%ICU%'`;
                break;
            case 'emergency':
                queryText += ` AND v.visit_type = 'EMERGENCY'`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid category' });
        }
        
        queryText += ' ORDER BY p.registered_at DESC LIMIT 100';
        
        const result = await query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patients by category:', err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

/**
 * Get patient status history
 */
export const getPatientStatusHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const result = await query(
            `SELECT psh.*, u.full_name as changed_by_name
            FROM patient_status_history psh
            LEFT JOIN users u ON psh.changed_by = u.id
            WHERE psh.patient_id = $1
            ORDER BY psh.changed_at DESC`,
            [patientId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patient status history:', err);
        res.status(500).json({ error: 'Failed to fetch patient status history' });
    }
};

/**
 * Get patient vitals history (read-only)
 */
export const getPatientVitals = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { startDate, endDate, limit = 50 } = req.query;
        
        let queryText = `
            SELECT v.*, u.full_name as captured_by_name
            FROM vitals v
            LEFT JOIN users u ON v.captured_by = u.id
            WHERE v.patient_id = $1
        `;
        const params = [patientId];
        
        if (startDate) {
            params.push(startDate);
            queryText += ` AND v.timestamp >= $${params.length}`;
        }
        
        if (endDate) {
            params.push(endDate);
            queryText += ` AND v.timestamp <= $${params.length}`;
        }
        
        params.push(limit);
        queryText += ` ORDER BY v.timestamp DESC LIMIT $${params.length}`;
        
        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patient vitals:', err);
        res.status(500).json({ error: 'Failed to fetch patient vitals' });
    }
};

/**
 * Get high-risk patients
 */
export const getHighRiskPatients = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                p.*,
                v.visit_type,
                v.status as visit_status,
                b.ward_name,
                b.bed_id_str,
                u.full_name as assigned_doctor
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE p.risk_level IN ('HIGH', 'CRITICAL')
            AND p.status IN ('ADMITTED', 'UNDER_OBSERVATION')
            ORDER BY 
                CASE p.risk_level
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                END,
                p.registered_at DESC
            LIMIT 50`
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching high-risk patients:', err);
        res.status(500).json({ error: 'Failed to fetch high-risk patients' });
    }
};

/**
 * Get patient dashboard statistics
 */
export const getPatientStatistics = async (req, res) => {
    try {
        // Overall stats
        const overallStats = await query(`
            SELECT 
                COUNT(*) as total_patients,
                COUNT(CASE WHEN registered_at >= CURRENT_DATE THEN 1 END) as patients_today,
                COUNT(CASE WHEN status = 'REGISTERED' THEN 1 END) as registered,
                COUNT(CASE WHEN status = 'ADMITTED' THEN 1 END) as admitted,
                COUNT(CASE WHEN status = 'DISCHARGED' THEN 1 END) as discharged,
                COUNT(CASE WHEN risk_level = 'HIGH' OR risk_level = 'CRITICAL' THEN 1 END) as high_risk
            FROM patients
        `);
        
        // Visit type breakdown
        const visitTypeStats = await query(`
            SELECT 
                v.visit_type,
                COUNT(*) as count,
                COUNT(CASE WHEN v.check_in_time >= CURRENT_DATE THEN 1 END) as today_count
            FROM visits v
            WHERE v.status != 'CLOSED'
            GROUP BY v.visit_type
        `);
        
        // Monthly trend
        const monthlyTrend = await query(`
            SELECT 
                DATE_TRUNC('month', registered_at) as month,
                COUNT(*) as patient_count
            FROM patients
            WHERE registered_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', registered_at)
            ORDER BY month DESC
        `);
        
        res.json({
            overall: overallStats.rows[0],
            byVisitType: visitTypeStats.rows,
            monthlyTrend: monthlyTrend.rows
        });
    } catch (err) {
        console.error('Error fetching patient statistics:', err);
        res.status(500).json({ error: 'Failed to fetch patient statistics' });
    }
};

/**
 * Search patients
 */
export const searchPatients = async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        
        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({ 
                error: 'Search query must be at least 2 characters' 
            });
        }
        
        const result = await query(
            `SELECT 
                p.*,
                v.visit_type,
                v.status as visit_status,
                b.ward_name,
                u.full_name as assigned_doctor
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE 
                p.patient_id_str ILIKE $1 OR
                p.first_name ILIKE $1 OR
                p.last_name ILIKE $1 OR
                p.contact ILIKE $1
            ORDER BY p.registered_at DESC
            LIMIT 50`,
            [`%${searchQuery}%`]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching patients:', err);
        res.status(500).json({ error: 'Failed to search patients' });
    }
};

/**
 * Get patient visit history
 */
export const getPatientVisitHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const result = await query(
            `SELECT 
                v.*,
                u.full_name as doctor_name,
                u.specialization,
                dn.chief_complaint,
                dn.diagnosis,
                COUNT(lo.order_id) as lab_orders_count
            FROM visits v
            LEFT JOIN users u ON v.doctor_id = u.id
            LEFT JOIN doctor_notes dn ON v.visit_id = dn.visit_id
            LEFT JOIN lab_orders lo ON v.visit_id = lo.visit_id
            WHERE v.patient_id = $1
            GROUP BY v.visit_id, u.id, dn.note_id
            ORDER BY v.check_in_time DESC`,
            [patientId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patient visit history:', err);
        res.status(500).json({ error: 'Failed to fetch patient visit history' });
    }
};

/**
 * Log admin view action (for audit trail)
 */
export const logPatientView = async (req, res) => {
    try {
        const { patientId } = req.params;
        const userId = req.user?.id || 1;
        
        await logAdminAction({
            userId,
            action: 'VIEW_PATIENT',
            module: 'PATIENT_MONITORING',
            entityId: patientId,
            details: { patientId },
            ipAddress: req.ip,
            severity: 'INFO'
        });
        
        res.json({ message: 'View logged' });
    } catch (err) {
        console.error('Error logging patient view:', err);
        res.status(500).json({ error: 'Failed to log patient view' });
    }
};
