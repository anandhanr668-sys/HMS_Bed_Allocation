import { query } from '../config/db.js';

/**
 * System-wide Audit Logger
 * Ensures all actions are persisted and auditable
 */
export const logAction = async ({
    userId,
    action,
    module,
    entityId,
    beforeState = null,
    afterState = null,
    details = {},
    ipAddress = '0.0.0.0',
    severity = 'INFO'
}) => {
    try {
        await query(
            `INSERT INTO audit_logs 
            (user_id, action, module, entity_id, before_state, after_state, details, ip_address, severity) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                userId,
                action,
                module,
                entityId,
                beforeState ? JSON.stringify(beforeState) : null,
                afterState ? JSON.stringify(afterState) : null,
                JSON.stringify(details),
                ipAddress,
                severity
            ]
        );
        console.log(`[AUDIT] ${module} | ${action} | User: ${userId} | Entity: ${entityId}`);
    } catch (err) {
        console.error('CRITICAL: Audit Log Error:', err);
        // In a real hospital system, we might want to throw here if audit is mandatory
        // For now, we log to console to prevent blocking clinical workflows
    }
};

// Maintain compatibility for existing calls
export const logAdminAction = logAction;
