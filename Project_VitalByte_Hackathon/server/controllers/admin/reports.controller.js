import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// REPORTS & ANALYTICS CONTROLLER
// Comprehensive Reporting System
// ============================================================

/**
 * Generate Daily Patient Report
 */
export const generateDailyPatientReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date || new Date().toISOString().split('T')[0];
        const userId = req.user?.id || 1;

        // Get all patients registered on the specified date
        const patientsResult = await query(
            `SELECT 
                p.patient_id_str,
                p.first_name || ' ' || p.last_name as patient_name,
                p.age,
                p.gender,
                p.contact,
                p.status,
                p.risk_level,
                v.visit_type,
                v.status as visit_status,
                u.full_name as assigned_doctor,
                p.registered_at
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE DATE(p.registered_at) = $1
            ORDER BY p.registered_at`,
            [reportDate]
        );

        // Get statistics for the day
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_patients,
                COUNT(CASE WHEN v.visit_type = 'OPD' THEN 1 END) as opd_count,
                COUNT(CASE WHEN v.visit_type = 'IPD' THEN 1 END) as ipd_count,
                COUNT(CASE WHEN v.visit_type = 'EMERGENCY' THEN 1 END) as emergency_count,
                COUNT(CASE WHEN p.risk_level IN ('HIGH', 'CRITICAL') THEN 1 END) as high_risk_count
            FROM patients p
            LEFT JOIN visits v ON p.patient_id_str = v.patient_id
            WHERE DATE(p.registered_at) = $1`,
            [reportDate]
        );

        // Log report generation
        await logAdminAction({
            userId,
            action: 'GENERATE_REPORT',
            module: 'REPORTS',
            entityId: `DAILY_PATIENT_${reportDate}`,
            details: { reportType: 'DAILY_PATIENT', date: reportDate },
            ipAddress: req.ip
        });

        res.json({
            reportType: 'DAILY_PATIENT_REPORT',
            date: reportDate,
            statistics: statsResult.rows[0],
            patients: patientsResult.rows,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        });
    } catch (err) {
        console.error('Error generating daily patient report:', err);
        res.status(500).json({ error: 'Failed to generate daily patient report' });
    }
};

/**
 * Generate Bed Utilization Report
 */
export const generateBedUtilizationReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user?.id || 1;

        // Current bed status
        const currentStatusResult = await query(`
            SELECT 
                ward_name,
                type as bed_type,
                COUNT(*) as total_beds,
                COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available,
                COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) as occupied,
                COUNT(CASE WHEN status = 'RESERVED' THEN 1 END) as reserved,
                COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as maintenance,
                ROUND(COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as occupancy_rate
            FROM beds
            GROUP BY ward_name, type
            ORDER BY ward_name, type
        `);

        // Bed assignment history
        let historyQuery = `
            SELECT 
                DATE(ba.assigned_at) as date,
                COUNT(*) as assignments,
                AVG(EXTRACT(EPOCH FROM (COALESCE(ba.released_at, CURRENT_TIMESTAMP) - ba.assigned_at)) / 3600) as avg_duration_hours
            FROM bed_assignments ba
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            params.push(startDate);
            historyQuery += ` AND ba.assigned_at >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            historyQuery += ` AND ba.assigned_at <= $${params.length}`;
        }

        historyQuery += ` GROUP BY DATE(ba.assigned_at) ORDER BY date DESC LIMIT 30`;

        const historyResult = await query(historyQuery, params);

        // Ward-wise utilization
        const wardUtilizationResult = await query(`
            SELECT 
                w.ward_name,
                w.ward_type,
                w.total_capacity,
                COUNT(b.id) as beds_configured,
                COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END) as beds_occupied,
                ROUND(COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END)::NUMERIC / w.total_capacity::NUMERIC * 100, 2) as utilization_percentage
            FROM ward_configuration w
            LEFT JOIN beds b ON w.ward_name = b.ward_name
            WHERE w.is_active = true
            GROUP BY w.id
            ORDER BY utilization_percentage DESC
        `);

        await logAdminAction({
            userId,
            action: 'GENERATE_REPORT',
            module: 'REPORTS',
            entityId: `BED_UTILIZATION_${new Date().toISOString()}`,
            details: { reportType: 'BED_UTILIZATION', startDate, endDate },
            ipAddress: req.ip
        });

        res.json({
            reportType: 'BED_UTILIZATION_REPORT',
            currentStatus: currentStatusResult.rows,
            assignmentHistory: historyResult.rows,
            wardUtilization: wardUtilizationResult.rows,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        });
    } catch (err) {
        console.error('Error generating bed utilization report:', err);
        res.status(500).json({ error: 'Failed to generate bed utilization report' });
    }
};

/**
 * Generate Emergency Cases Report
 */
export const generateEmergencyCasesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user?.id || 1;

        let queryText = `
            SELECT 
                p.patient_id_str,
                p.first_name || ' ' || p.last_name as patient_name,
                p.age,
                p.gender,
                p.risk_level,
                v.visit_type,
                v.priority,
                v.status as visit_status,
                v.check_in_time,
                v.check_out_time,
                u.full_name as attending_doctor,
                b.bed_id_str,
                b.ward_name,
                dn.chief_complaint,
                dn.diagnosis
            FROM visits v
            JOIN patients p ON v.patient_id = p.patient_id_str
            LEFT JOIN users u ON v.doctor_id = u.id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            LEFT JOIN doctor_notes dn ON v.visit_id = dn.visit_id
            WHERE v.visit_type = 'EMERGENCY'
        `;
        const params = [];

        if (startDate) {
            params.push(startDate);
            queryText += ` AND v.check_in_time >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            queryText += ` AND v.check_in_time <= $${params.length}`;
        }

        queryText += ` ORDER BY v.check_in_time DESC`;

        const casesResult = await query(queryText, params);

        // Statistics
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_emergency_cases,
                COUNT(CASE WHEN v.priority = 'STAT' THEN 1 END) as stat_cases,
                COUNT(CASE WHEN v.priority = 'URGENT' THEN 1 END) as urgent_cases,
                COUNT(CASE WHEN p.risk_level = 'CRITICAL' THEN 1 END) as critical_cases,
                AVG(EXTRACT(EPOCH FROM (COALESCE(v.check_out_time, CURRENT_TIMESTAMP) - v.check_in_time)) / 60) as avg_duration_minutes
            FROM visits v
            JOIN patients p ON v.patient_id = p.patient_id_str
            WHERE v.visit_type = 'EMERGENCY'
            ${startDate ? `AND v.check_in_time >= $1` : ''}
            ${endDate ? `AND v.check_in_time <= $${startDate ? 2 : 1}` : ''}`,
            params
        );

        await logAdminAction({
            userId,
            action: 'GENERATE_REPORT',
            module: 'REPORTS',
            entityId: `EMERGENCY_CASES_${new Date().toISOString()}`,
            details: { reportType: 'EMERGENCY_CASES', startDate, endDate },
            ipAddress: req.ip
        });

        res.json({
            reportType: 'EMERGENCY_CASES_REPORT',
            statistics: statsResult.rows[0],
            cases: casesResult.rows,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        });
    } catch (err) {
        console.error('Error generating emergency cases report:', err);
        res.status(500).json({ error: 'Failed to generate emergency cases report' });
    }
};

/**
 * Generate Doctor Consultation Report
 */
export const generateDoctorConsultationReport = async (req, res) => {
    try {
        const { doctorId, startDate, endDate } = req.query;
        const userId = req.user?.id || 1;

        let queryText = `
            SELECT 
                u.id as doctor_id,
                u.full_name as doctor_name,
                u.specialization,
                COUNT(v.visit_id) as total_consultations,
                COUNT(CASE WHEN v.visit_type = 'OPD' THEN 1 END) as opd_consultations,
                COUNT(CASE WHEN v.visit_type = 'IPD' THEN 1 END) as ipd_consultations,
                COUNT(CASE WHEN v.visit_type = 'EMERGENCY' THEN 1 END) as emergency_consultations,
                COUNT(CASE WHEN v.status = 'CLOSED' THEN 1 END) as completed_consultations,
                AVG(EXTRACT(EPOCH FROM (COALESCE(v.check_out_time, CURRENT_TIMESTAMP) - v.check_in_time)) / 60) as avg_consultation_time_minutes
            FROM users u
            LEFT JOIN visits v ON u.id = v.doctor_id
            WHERE u.role = 'DOCTOR' AND u.status = 'ACTIVE'
        `;
        const params = [];

        if (doctorId) {
            params.push(doctorId);
            queryText += ` AND u.id = $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            queryText += ` AND v.check_in_time >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            queryText += ` AND v.check_in_time <= $${params.length}`;
        }

        queryText += ` GROUP BY u.id ORDER BY total_consultations DESC`;

        const consultationsResult = await query(queryText, params);

        // If specific doctor, get detailed patient list
        let patientDetails = [];
        if (doctorId) {
            let patientQuery = `
                SELECT 
                    p.patient_id_str,
                    p.first_name || ' ' || p.last_name as patient_name,
                    v.visit_type,
                    v.check_in_time,
                    v.check_out_time,
                    v.status as visit_status,
                    dn.chief_complaint,
                    dn.diagnosis
                FROM visits v
                JOIN patients p ON v.patient_id = p.patient_id_str
                LEFT JOIN doctor_notes dn ON v.visit_id = dn.visit_id
                WHERE v.doctor_id = $1
            `;
            const patientParams = [doctorId];

            if (startDate) {
                patientParams.push(startDate);
                patientQuery += ` AND v.check_in_time >= $${patientParams.length}`;
            }

            if (endDate) {
                patientParams.push(endDate);
                patientQuery += ` AND v.check_in_time <= $${patientParams.length}`;
            }

            patientQuery += ` ORDER BY v.check_in_time DESC`;

            const patientResult = await query(patientQuery, patientParams);
            patientDetails = patientResult.rows;
        }

        await logAdminAction({
            userId,
            action: 'GENERATE_REPORT',
            module: 'REPORTS',
            entityId: `DOCTOR_CONSULTATION_${new Date().toISOString()}`,
            details: { reportType: 'DOCTOR_CONSULTATION', doctorId, startDate, endDate },
            ipAddress: req.ip
        });

        res.json({
            reportType: 'DOCTOR_CONSULTATION_REPORT',
            summary: consultationsResult.rows,
            patientDetails: patientDetails,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        });
    } catch (err) {
        console.error('Error generating doctor consultation report:', err);
        res.status(500).json({ error: 'Failed to generate doctor consultation report' });
    }
};

/**
 * Generate Patient Visit History Report
 */
export const generatePatientVisitHistoryReport = async (req, res) => {
    try {
        const { patientId } = req.params;
        const userId = req.user?.id || 1;

        // Get patient info
        const patientResult = await query(
            `SELECT * FROM patients WHERE patient_id_str = $1`,
            [patientId]
        );

        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Get all visits
        const visitsResult = await query(
            `SELECT 
                v.*,
                u.full_name as doctor_name,
                u.specialization,
                dn.chief_complaint,
                dn.diagnosis,
                dn.treatment_plan,
                dn.prescription_data
            FROM visits v
            LEFT JOIN users u ON v.doctor_id = u.id
            LEFT JOIN doctor_notes dn ON v.visit_id = dn.visit_id
            WHERE v.patient_id = $1
            ORDER BY v.check_in_time DESC`,
            [patientId]
        );

        // Get vitals history
        const vitalsResult = await query(
            `SELECT * FROM vitals 
            WHERE patient_id = $1 
            ORDER BY timestamp DESC 
            LIMIT 20`,
            [patientId]
        );

        // Get lab orders
        const labOrdersResult = await query(
            `SELECT lo.*, v.check_in_time as visit_date
            FROM lab_orders lo
            JOIN visits v ON lo.visit_id = v.visit_id
            WHERE v.patient_id = $1
            ORDER BY lo.ordered_at DESC`,
            [patientId]
        );

        await logAdminAction({
            userId,
            action: 'GENERATE_REPORT',
            module: 'REPORTS',
            entityId: `PATIENT_HISTORY_${patientId}`,
            details: { reportType: 'PATIENT_VISIT_HISTORY', patientId },
            ipAddress: req.ip
        });

        res.json({
            reportType: 'PATIENT_VISIT_HISTORY_REPORT',
            patient: patientResult.rows[0],
            visits: visitsResult.rows,
            vitalsHistory: vitalsResult.rows,
            labOrders: labOrdersResult.rows,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        });
    } catch (err) {
        console.error('Error generating patient visit history report:', err);
        res.status(500).json({ error: 'Failed to generate patient visit history report' });
    }
};

/**
 * Get report templates
 */
export const getReportTemplates = async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM report_templates WHERE is_active = true ORDER BY report_name`
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching report templates:', err);
        res.status(500).json({ error: 'Failed to fetch report templates' });
    }
};

/**
 * Get report execution history
 */
export const getReportExecutionHistory = async (req, res) => {
    try {
        const { reportId, limit = 50 } = req.query;

        let queryText = `
            SELECT re.*, rt.report_name, u.full_name as executed_by_name
            FROM report_executions re
            LEFT JOIN report_templates rt ON re.report_id = rt.report_id
            LEFT JOIN users u ON re.executed_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (reportId) {
            params.push(reportId);
            queryText += ` AND re.report_id = $${params.length}`;
        }

        params.push(limit);
        queryText += ` ORDER BY re.executed_at DESC LIMIT $${params.length}`;

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching report execution history:', err);
        res.status(500).json({ error: 'Failed to fetch report execution history' });
    }
};

/**
 * Export report as CSV (simplified)
 */
export const exportReportAsCSV = async (req, res) => {
    try {
        const { reportType, data } = req.body;
        const userId = req.user?.id || 1;

        // This is a simplified version - in production, you'd use a proper CSV library
        let csv = '';

        if (data && data.length > 0) {
            // Headers
            csv += Object.keys(data[0]).join(',') + '\n';

            // Rows
            data.forEach(row => {
                csv += Object.values(row).map(val =>
                    typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                ).join(',') + '\n';
            });
        }

        await logAdminAction({
            userId,
            action: 'EXPORT_REPORT',
            module: 'REPORTS',
            entityId: `EXPORT_${reportType}_${new Date().toISOString()}`,
            details: { reportType, format: 'CSV', rowCount: data.length },
            ipAddress: req.ip
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error('Error exporting report as CSV:', err);
        res.status(500).json({ error: 'Failed to export report' });
    }
};
