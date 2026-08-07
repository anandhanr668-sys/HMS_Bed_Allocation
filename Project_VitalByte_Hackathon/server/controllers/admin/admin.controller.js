import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// ADMIN DASHBOARD CONTROLLER
// Real-time System Overview & Statistics
// ============================================================

/**
 * Get comprehensive admin dashboard statistics
 */
export const getAdminStats = async (req, res) => {
    try {
        const { view, date: customDate } = req.query;
        let whereClause = '';
        let displayLabel = 'Today';

        if (customDate) {
            whereClause = `::DATE = '${customDate}'::DATE`;
            displayLabel = customDate;
        } else if (view === 'weekly') {
            whereClause = ` >= CURRENT_DATE - INTERVAL '7 days'`;
            displayLabel = 'Last 7 Days';
        } else {
            whereClause = `::DATE = CURRENT_DATE`;
            displayLabel = 'Today';
        }

        console.log(`[DEBUG] Fetching Stats for: ${displayLabel}`);

        // Efficient parallel query execution
        const [patientStats, visitStats, bedStats, alertStats, recentActivity, wardOccupancy] = await Promise.all([
            query(`
                SELECT 
                    (SELECT COUNT(*)::INT FROM patients) as total_patients_all_time,
                    (SELECT COUNT(*)::INT FROM patients WHERE registered_at${whereClause}) as patients_in_range,
                    (SELECT COUNT(*)::INT FROM patients WHERE status = 'ADMITTED') as currently_admitted,
                    (SELECT COUNT(*)::INT FROM protocol_executions WHERE alert_level IN ('HIGH', 'CRITICAL') AND resolution_status = 'PENDING') as high_risk_patients
                FROM (SELECT 1) as dummy
            `),
            query(`
                SELECT 
                    COUNT(*) FILTER (WHERE visit_type = 'OPD' AND check_in_time${whereClause})::INT as opd_count,
                    COUNT(*) FILTER (WHERE visit_type = 'IPD' AND check_in_time${whereClause})::INT as ipd_count,
                    COUNT(*) FILTER (WHERE visit_type = 'EMERGENCY' AND check_in_time${whereClause})::INT as emergency_count,
                    COUNT(*) FILTER (WHERE status != 'CLOSED')::INT as active_visits
                FROM visits
            `),
            query(`
                SELECT 
                    COUNT(*)::INT as total_beds,
                    COUNT(*) FILTER (WHERE status = 'AVAILABLE')::INT as available_beds,
                    COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied_beds,
                    ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_rate
                FROM beds
            `),
            query(`
                SELECT 
                    COUNT(*)::INT as total_active_alerts,
                    COUNT(*) FILTER (WHERE alert_level = 'CRITICAL')::INT as critical_alerts,
                    COUNT(*) FILTER (WHERE alert_level = 'HIGH')::INT as high_alerts
                FROM protocol_executions
                WHERE resolution_status = 'PENDING'
            `),
            query(`
                SELECT id, action, module, details, timestamp
                FROM audit_logs
                WHERE timestamp${whereClause}
                ORDER BY timestamp DESC
                LIMIT 15
            `),
            query(`
                SELECT 
                    ward_name,
                    COUNT(*)::INT as total_beds,
                    COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied,
                    ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_percentage
                FROM beds
                GROUP BY ward_name
                ORDER BY occupancy_percentage DESC
            `)
        ]);

        res.json({
            patients: patientStats.rows[0],
            visits: visitStats.rows[0],
            beds: bedStats.rows[0],
            alerts: alertStats.rows[0],
            recentActivity: recentActivity.rows,
            wardOccupancy: wardOccupancy.rows,
            rangeInfo: {
                label: displayLabel,
                serverTime: new Date().toISOString(),
                sqlCountVerify: patientStats.rows[0].patients_in_range
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (req, res) => {
    try {
        // Database connection check
        const dbCheck = await query('SELECT NOW()');

        // Count of records in key tables
        const tableCounts = await query(`
            SELECT 
                (SELECT COUNT(*) FROM patients) as patients_count,
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM beds) as beds_count,
                (SELECT COUNT(*) FROM visits) as visits_count,
                (SELECT COUNT(*) FROM form_templates) as forms_count,
                (SELECT COUNT(*) FROM clinical_protocols) as protocols_count
        `);

        // Recent errors in audit logs
        const recentErrors = await query(`
            SELECT COUNT(*) as error_count
            FROM audit_logs
            WHERE severity = 'CRITICAL'
            AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        `);

        res.json({
            status: 'HEALTHY',
            database: {
                connected: true,
                timestamp: dbCheck.rows[0].now
            },
            tableCounts: tableCounts.rows[0],
            recentErrors: recentErrors.rows[0].error_count,
            uptime: process.uptime(),
            checkedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error checking system health:', err);
        res.status(500).json({
            status: 'UNHEALTHY',
            error: 'Failed to check system health'
        });
    }
};

/**
 * Get recent audit logs
 */
export const getRecentAuditLogs = async (req, res) => {
    try {
        const { limit = 50, module, severity } = req.query;

        let queryText = `
            SELECT al.*, u.full_name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (module) {
            params.push(module);
            queryText += ` AND al.module = $${params.length}`;
        }

        if (severity) {
            params.push(severity);
            queryText += ` AND al.severity = $${params.length}`;
        }

        params.push(limit);
        queryText += ` ORDER BY al.timestamp DESC LIMIT $${params.length}`;

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

/**
 * Get emergency override status
 */
export const getEmergencyOverrides = async (req, res) => {
    try {
        const result = await query(`
            SELECT eo.*, u.full_name as activated_by_name
            FROM emergency_overrides eo
            LEFT JOIN users u ON eo.activated_by = u.id
            WHERE eo.is_active = true
            ORDER BY eo.activated_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching emergency overrides:', err);
        res.status(500).json({ error: 'Failed to fetch emergency overrides' });
    }
};

/**
 * Activate emergency override
 */
export const activateEmergencyOverride = async (req, res) => {
    try {
        const { overrideType, reason, affectedEntities } = req.body;
        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO emergency_overrides 
            (override_type, is_active, activated_by, activated_at, reason, affected_entities)
            VALUES ($1, true, $2, CURRENT_TIMESTAMP, $3, $4)
            RETURNING *`,
            [overrideType, userId, reason, JSON.stringify(affectedEntities || {})]
        );

        await logAdminAction({
            userId,
            action: 'ACTIVATE_EMERGENCY_OVERRIDE',
            module: 'SYSTEM',
            entityId: result.rows[0].id,
            details: { overrideType, reason },
            ipAddress: req.ip,
            severity: 'CRITICAL'
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error activating emergency override:', err);
        res.status(500).json({ error: 'Failed to activate emergency override' });
    }
};

/**
 * Deactivate emergency override
 */
export const deactivateEmergencyOverride = async (req, res) => {
    try {
        const { overrideId } = req.params;
        const userId = req.user?.id || 1;

        await query(
            `UPDATE emergency_overrides 
            SET is_active = false, deactivated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
            [overrideId]
        );

        await logAdminAction({
            userId,
            action: 'DEACTIVATE_EMERGENCY_OVERRIDE',
            module: 'SYSTEM',
            entityId: overrideId,
            details: { overrideId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({ message: 'Emergency override deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating emergency override:', err);
        res.status(500).json({ error: 'Failed to deactivate emergency override' });
    }
};

/**
 * Get hospital configuration
 */
export const getHospitalConfig = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM hospital_config ORDER BY config_key'
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching hospital config:', err);
        res.status(500).json({ error: 'Failed to fetch hospital configuration' });
    }
};

/**
 * Update hospital configuration
 */
export const updateHospitalConfig = async (req, res) => {
    try {
        const { configKey, configValue, description } = req.body;
        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO hospital_config (config_key, config_value, description, updated_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (config_key) 
            DO UPDATE SET 
                config_value = $2,
                description = $3,
                updated_by = $4,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [configKey, JSON.stringify(configValue), description, userId]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_HOSPITAL_CONFIG',
            module: 'SYSTEM',
            entityId: configKey,
            details: { configKey, configValue },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating hospital config:', err);
        res.status(500).json({ error: 'Failed to update hospital configuration' });
    }
};
