import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// CLINICAL PROTOCOL BUILDER CONTROLLER
// No-Code Clinical Rules & Alert Configuration
// ============================================================

/**
 * Get all clinical protocols
 */
export const getAllProtocols = async (req, res) => {
    try {
        const { type, isActive } = req.query;

        let queryText = 'SELECT * FROM clinical_protocols WHERE 1=1';
        const params = [];

        if (type) {
            params.push(type);
            queryText += ` AND protocol_type = $${params.length}`;
        }

        if (isActive !== undefined) {
            params.push(isActive === 'true');
            queryText += ` AND is_active = $${params.length}`;
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching protocols:', err);
        res.status(500).json({ error: 'Failed to fetch protocols' });
    }
};

/**
 * Get protocol by ID
 */
export const getProtocolById = async (req, res) => {
    try {
        const { protocolId } = req.params;

        const result = await query(
            'SELECT * FROM clinical_protocols WHERE protocol_id = $1',
            [protocolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Protocol not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching protocol:', err);
        res.status(500).json({ error: 'Failed to fetch protocol' });
    }
};

/**
 * Create new clinical protocol
 */
export const createProtocol = async (req, res) => {
    try {
        const {
            protocolId,
            protocolName,
            protocolType,
            rules,
            alertLevels,
            assignedTo,
            appliesTo
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO clinical_protocols 
            (protocol_id, protocol_name, protocol_type, rules, alert_levels, assigned_to, applies_to, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                protocolId,
                protocolName,
                protocolType,
                JSON.stringify(rules),
                JSON.stringify(alertLevels || {}),
                JSON.stringify(assignedTo || []),
                appliesTo,
                userId
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_PROTOCOL',
            module: 'PROTOCOLS',
            entityId: protocolId,
            details: { protocolName, protocolType },
            ipAddress: req.ip,
            severity: 'INFO'
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating protocol:', err);
        res.status(500).json({ error: 'Failed to create protocol' });
    }
};

/**
 * Update clinical protocol
 */
export const updateProtocol = async (req, res) => {
    try {
        const { protocolId } = req.params;
        const {
            protocolName,
            rules,
            alertLevels,
            assignedTo,
            appliesTo,
            isActive
        } = req.body;

        const userId = req.user?.id || 1;

        // Get current state for audit
        const currentState = await query(
            'SELECT * FROM clinical_protocols WHERE protocol_id = $1',
            [protocolId]
        );

        const result = await query(
            `UPDATE clinical_protocols 
            SET protocol_name = COALESCE($1, protocol_name),
                rules = COALESCE($2, rules),
                alert_levels = COALESCE($3, alert_levels),
                assigned_to = COALESCE($4, assigned_to),
                applies_to = COALESCE($5, applies_to),
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE protocol_id = $7
            RETURNING *`,
            [
                protocolName,
                rules ? JSON.stringify(rules) : null,
                alertLevels ? JSON.stringify(alertLevels) : null,
                assignedTo ? JSON.stringify(assignedTo) : null,
                appliesTo,
                isActive,
                protocolId
            ]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_PROTOCOL',
            module: 'PROTOCOLS',
            entityId: protocolId,
            details: { protocolName, changes: req.body },
            beforeState: currentState.rows[0],
            afterState: result.rows[0],
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating protocol:', err);
        res.status(500).json({ error: 'Failed to update protocol' });
    }
};

/**
 * Publish protocol
 */
export const publishProtocol = async (req, res) => {
    try {
        const { protocolId } = req.params;
        const userId = req.user?.id || 1;

        const result = await query(
            `UPDATE clinical_protocols 
            SET is_active = true,
                published_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE protocol_id = $1
            RETURNING *`,
            [protocolId]
        );

        await logAdminAction({
            userId,
            action: 'PUBLISH_PROTOCOL',
            module: 'PROTOCOLS',
            entityId: protocolId,
            details: { protocolId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({
            message: 'Protocol published successfully',
            protocol: result.rows[0]
        });
    } catch (err) {
        console.error('Error publishing protocol:', err);
        res.status(500).json({ error: 'Failed to publish protocol' });
    }
};

/**
 * Execute protocol (check vitals against rules)
 */
export const executeProtocol = async (req, res) => {
    try {
        const { protocolId } = req.params;
        const { patientId, visitId, vitalsData } = req.body;

        // Get protocol
        const protocolResult = await query(
            'SELECT * FROM clinical_protocols WHERE protocol_id = $1 AND is_active = true',
            [protocolId]
        );

        if (protocolResult.rows.length === 0) {
            return res.status(404).json({ error: 'Protocol not found or not active' });
        }

        const protocol = protocolResult.rows[0];
        const rules = protocol.rules;

        // Evaluate vitals against rules
        const alerts = [];
        const thresholds = rules.vitals_thresholds || {};

        // Check Blood Pressure
        if (vitalsData.bp_systolic && thresholds.blood_pressure) {
            const bpThresholds = thresholds.blood_pressure.systolic;
            let level = 'NORMAL';

            if (vitalsData.bp_systolic >= bpThresholds.critical) level = 'CRITICAL';
            else if (vitalsData.bp_systolic >= bpThresholds.high) level = 'HIGH';
            else if (vitalsData.bp_systolic >= bpThresholds.medium) level = 'MEDIUM';
            else if (vitalsData.bp_systolic < bpThresholds.low) level = 'LOW';

            if (level !== 'NORMAL') {
                alerts.push({
                    type: 'BLOOD_PRESSURE_SYSTOLIC',
                    value: vitalsData.bp_systolic,
                    level,
                    threshold: bpThresholds[level.toLowerCase()]
                });
            }
        }

        // Check Heart Rate
        if (vitalsData.bpm && thresholds.heart_rate) {
            const hrThresholds = thresholds.heart_rate;
            let level = 'NORMAL';

            if (vitalsData.bpm >= hrThresholds.critical) level = 'CRITICAL';
            else if (vitalsData.bpm >= hrThresholds.high) level = 'HIGH';
            else if (vitalsData.bpm >= hrThresholds.medium) level = 'MEDIUM';
            else if (vitalsData.bpm < hrThresholds.low) level = 'LOW';

            if (level !== 'NORMAL') {
                alerts.push({
                    type: 'HEART_RATE',
                    value: vitalsData.bpm,
                    level,
                    threshold: hrThresholds[level.toLowerCase()]
                });
            }
        }

        // Check SpO2
        if (vitalsData.spo2 && thresholds.spo2) {
            const spo2Thresholds = thresholds.spo2;
            let level = 'NORMAL';

            if (vitalsData.spo2 <= spo2Thresholds.critical) level = 'CRITICAL';
            else if (vitalsData.spo2 <= spo2Thresholds.high) level = 'HIGH';
            else if (vitalsData.spo2 <= spo2Thresholds.medium) level = 'MEDIUM';

            if (level !== 'NORMAL') {
                alerts.push({
                    type: 'SPO2',
                    value: vitalsData.spo2,
                    level,
                    threshold: spo2Thresholds[level.toLowerCase()]
                });
            }
        }

        // Check Temperature
        if (vitalsData.temperature && thresholds.temperature) {
            const tempThresholds = thresholds.temperature;
            let level = 'NORMAL';

            if (vitalsData.temperature >= tempThresholds.critical) level = 'CRITICAL';
            else if (vitalsData.temperature >= tempThresholds.high) level = 'HIGH';
            else if (vitalsData.temperature >= tempThresholds.medium) level = 'MEDIUM';
            else if (vitalsData.temperature < tempThresholds.low) level = 'LOW';

            if (level !== 'NORMAL') {
                alerts.push({
                    type: 'TEMPERATURE',
                    value: vitalsData.temperature,
                    level,
                    threshold: tempThresholds[level.toLowerCase()]
                });
            }
        }

        // Determine highest alert level
        const alertLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const highestLevel = alerts.reduce((max, alert) => {
            const currentIndex = alertLevels.indexOf(alert.level);
            const maxIndex = alertLevels.indexOf(max);
            return currentIndex > maxIndex ? alert.level : max;
        }, 'LOW');

        // Get notification recipients based on alert level
        const alertConfig = rules.alert_config || {};
        const notifyConfig = alertConfig[highestLevel.toLowerCase()] || {};
        const notifyRoles = notifyConfig.notify || [];

        // Get user IDs to notify
        const usersToNotify = await query(
            'SELECT id FROM users WHERE role = ANY($1) AND status = $2',
            [notifyRoles, 'ACTIVE']
        );

        const notifyUserIds = usersToNotify.rows.map(u => u.id);

        // Log protocol execution
        if (alerts.length > 0) {
            await query(
                `INSERT INTO protocol_executions 
                (protocol_id, patient_id, visit_id, triggered_by, trigger_data, alert_level, alert_sent_to)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    protocolId,
                    patientId,
                    visitId,
                    'VITALS_CHECK',
                    JSON.stringify({ vitalsData, alerts }),
                    highestLevel,
                    JSON.stringify(notifyUserIds)
                ]
            );
        }

        res.json({
            protocolExecuted: true,
            alerts,
            highestLevel,
            notified: notifyUserIds,
            message: alerts.length > 0
                ? `${alerts.length} alert(s) triggered at ${highestLevel} level`
                : 'All vitals within normal range'
        });
    } catch (err) {
        console.error('Error executing protocol:', err);
        res.status(500).json({ error: 'Failed to execute protocol' });
    }
};

/**
 * Get protocol executions (alert history)
 */
export const getProtocolExecutions = async (req, res) => {
    try {
        const { protocolId, patientId, status, startDate, endDate } = req.query;

        let queryText = `
            SELECT pe.*, p.first_name, p.last_name, cp.protocol_name
            FROM protocol_executions pe
            LEFT JOIN patients p ON pe.patient_id = p.patient_id_str
            LEFT JOIN clinical_protocols cp ON pe.protocol_id = cp.protocol_id
            WHERE 1=1
        `;
        const params = [];

        if (protocolId) {
            params.push(protocolId);
            queryText += ` AND pe.protocol_id = $${params.length}`;
        }

        if (patientId) {
            params.push(patientId);
            queryText += ` AND pe.patient_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            queryText += ` AND pe.resolution_status = $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            queryText += ` AND pe.executed_at >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            queryText += ` AND pe.executed_at <= $${params.length}`;
        }

        queryText += ' ORDER BY pe.executed_at DESC LIMIT 100';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching protocol executions:', err);
        res.status(500).json({ error: 'Failed to fetch protocol executions' });
    }
};

/**
 * Resolve protocol alert
 */
export const resolveProtocolAlert = async (req, res) => {
    try {
        const { executionId } = req.params;
        const { resolution } = req.body;
        const userId = req.user?.id || 1;

        const result = await query(
            `UPDATE protocol_executions 
            SET resolution_status = 'RESOLVED',
                resolved_by = $1,
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *`,
            [userId, executionId]
        );

        await logAdminAction({
            userId,
            action: 'RESOLVE_PROTOCOL_ALERT',
            module: 'PROTOCOLS',
            entityId: executionId,
            details: { resolution },
            ipAddress: req.ip
        });

        res.json({
            message: 'Alert resolved successfully',
            execution: result.rows[0]
        });
    } catch (err) {
        console.error('Error resolving alert:', err);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
};

/**
 * Delete protocol (soft delete)
 */
export const deleteProtocol = async (req, res) => {
    try {
        const { protocolId } = req.params;
        const userId = req.user?.id || 1;

        await query(
            'UPDATE clinical_protocols SET is_active = false WHERE protocol_id = $1',
            [protocolId]
        );

        await logAdminAction({
            userId,
            action: 'DELETE_PROTOCOL',
            module: 'PROTOCOLS',
            entityId: protocolId,
            details: { protocolId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({ message: 'Protocol deactivated successfully' });
    } catch (err) {
        console.error('Error deleting protocol:', err);
        res.status(500).json({ error: 'Failed to delete protocol' });
    }
};

/**
 * Get active alerts (unresolved)
 */
export const getActiveAlerts = async (req, res) => {
    try {
        const result = await query(
            `SELECT pe.*, p.first_name, p.last_name, cp.protocol_name, b.bed_id_str, b.ward_name
            FROM protocol_executions pe
            LEFT JOIN patients p ON pe.patient_id = p.patient_id_str
            LEFT JOIN clinical_protocols cp ON pe.protocol_id = cp.protocol_id
            LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
            WHERE pe.resolution_status = 'PENDING'
            ORDER BY 
                CASE pe.alert_level
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                END,
                pe.executed_at DESC
            LIMIT 50`
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching active alerts:', err);
        res.status(500).json({ error: 'Failed to fetch active alerts' });
    }
};
