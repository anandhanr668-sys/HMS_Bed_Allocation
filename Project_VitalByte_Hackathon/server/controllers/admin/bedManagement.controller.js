import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// BED & WARD MANAGEMENT CONTROLLER
// Full Configuration & Real-time Monitoring
// ============================================================

/**
 * Get all wards
 */
export const getAllWards = async (req, res) => {
    try {
        const { isActive } = req.query;

        let queryText = `
            SELECT w.*, 
                   COUNT(b.id) as total_beds,
                   COUNT(CASE WHEN b.status = 'AVAILABLE' THEN 1 END) as available_beds,
                   COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END) as occupied_beds,
                   COUNT(CASE WHEN b.status = 'MAINTENANCE' THEN 1 END) as maintenance_beds
            FROM ward_configuration w
            LEFT JOIN beds b ON w.ward_name = b.ward_name
            WHERE 1=1
        `;
        const params = [];

        if (isActive !== undefined) {
            params.push(isActive === 'true');
            queryText += ` AND w.is_active = $${params.length}`;
        }

        queryText += ' GROUP BY w.id ORDER BY w.ward_name';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching wards:', err);
        res.status(500).json({ error: 'Failed to fetch wards' });
    }
};

/**
 * Create new ward
 */
export const createWard = async (req, res) => {
    try {
        const {
            wardId,
            wardName,
            wardType,
            floorNumber,
            totalCapacity,
            config
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO ward_configuration 
            (ward_id, ward_name, ward_type, floor_number, total_capacity, config, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                wardId,
                wardName,
                wardType,
                floorNumber,
                totalCapacity,
                JSON.stringify(config || {}),
                userId
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_WARD',
            module: 'BED_MANAGEMENT',
            entityId: wardId,
            details: { wardName, wardType, totalCapacity },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating ward:', err);
        res.status(500).json({ error: 'Failed to create ward' });
    }
};

/**
 * Update ward
 */
export const updateWard = async (req, res) => {
    try {
        const { wardId } = req.params;
        const {
            wardName,
            wardType,
            floorNumber,
            totalCapacity,
            config,
            isActive
        } = req.body;

        const userId = req.user?.id || 1;

        // Get current state
        const currentState = await query(
            'SELECT * FROM ward_configuration WHERE ward_id = $1',
            [wardId]
        );

        const result = await query(
            `UPDATE ward_configuration 
            SET ward_name = COALESCE($1, ward_name),
                ward_type = COALESCE($2, ward_type),
                floor_number = COALESCE($3, floor_number),
                total_capacity = COALESCE($4, total_capacity),
                config = COALESCE($5, config),
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE ward_id = $7
            RETURNING *`,
            [
                wardName,
                wardType,
                floorNumber,
                totalCapacity,
                config ? JSON.stringify(config) : null,
                isActive,
                wardId
            ]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_WARD',
            module: 'BED_MANAGEMENT',
            entityId: wardId,
            details: { changes: req.body },
            beforeState: currentState.rows[0],
            afterState: result.rows[0],
            ipAddress: req.ip
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating ward:', err);
        res.status(500).json({ error: 'Failed to update ward' });
    }
};

/**
 * Get all beds with filters
 */
export const getAllBeds = async (req, res) => {
    try {
        const { wardName, status, type } = req.query;

        let queryText = `
            SELECT b.*, p.first_name, p.last_name, p.patient_id_str
            FROM beds b
            LEFT JOIN patients p ON b.patient_id = p.patient_id_str
            WHERE 1=1
        `;
        const params = [];

        if (wardName) {
            params.push(wardName);
            queryText += ` AND b.ward_name = $${params.length}`;
        }

        if (status) {
            params.push(status);
            queryText += ` AND b.status = $${params.length}`;
        }

        if (type) {
            params.push(type);
            queryText += ` AND b.type = $${params.length}`;
        }

        queryText += ' ORDER BY b.ward_name, b.bed_id_str';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching beds:', err);
        res.status(500).json({ error: 'Failed to fetch beds' });
    }
};

/**
 * Create new bed
 */
export const createBed = async (req, res) => {
    try {
        const {
            bedIdStr,
            wardName,
            type,
            floorNumber,
            features
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO beds 
            (bed_id_str, ward_name, type, floor_number, features, status)
            VALUES ($1, $2, $3, $4, $5, 'AVAILABLE')
            RETURNING *`,
            [
                bedIdStr,
                wardName,
                type,
                floorNumber,
                JSON.stringify(features || [])
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_BED',
            module: 'BED_MANAGEMENT',
            entityId: bedIdStr,
            details: { bedIdStr, wardName, type },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating bed:', err);
        res.status(500).json({ error: 'Failed to create bed' });
    }
};

/**
 * Update bed
 */
export const updateBed = async (req, res) => {
    try {
        const { bedId } = req.params;
        const {
            wardName,
            type,
            status,
            floorNumber,
            features,
            maintenanceNotes,
            assigned_patient_id // New field for assignment handling
        } = req.body;

        const userId = req.user?.id || 1;

        // Get current state
        const currentState = await query(
            'SELECT * FROM beds WHERE bed_id_str = $1',
            [bedId]
        );

        if (currentState.rows.length === 0) {
            return res.status(404).json({ error: 'Bed not found' });
        }

        const currentBed = currentState.rows[0];

        // LOGIC: Handling Patient Assignment/Release
        // If assigned_patient_id is strictly provided (not undefined)
        let newPatientId = currentBed.patient_id;

        if (assigned_patient_id !== undefined) {
            newPatientId = assigned_patient_id;

            // HISTORY TRACKING
            if (currentBed.patient_id !== newPatientId) {
                // 1. Release Old Assignment if exists
                if (currentBed.patient_id) {
                    await query(
                        `UPDATE bed_assignments 
                          SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP, released_by = $1 
                          WHERE bed_id = $2 AND status = 'ACTIVE'`,
                        [userId, bedId]
                    );
                }

                // 2. Create New Assignment if newPatientId is valid
                if (newPatientId) {
                    await query(
                        `INSERT INTO bed_assignments (bed_id, patient_id, assigned_by, status)
                          VALUES ($1, $2, $3, 'ACTIVE')`,
                        [bedId, newPatientId, userId]
                    );
                }
            }
        }

        const result = await query(
            `UPDATE beds 
            SET ward_name = COALESCE($1, ward_name),
                type = COALESCE($2, type),
                status = COALESCE($3, status),
                floor_number = COALESCE($4, floor_number),
                features = COALESCE($5, features),
                maintenance_notes = COALESCE($6, maintenance_notes),
                patient_id = $7, -- Direct update, allows NULL
                last_updated = CURRENT_TIMESTAMP
            WHERE bed_id_str = $8
            RETURNING *`,
            [
                wardName,
                type,
                status,
                floorNumber,
                features ? JSON.stringify(features) : null,
                maintenanceNotes,
                newPatientId, // Updated or original patient_id
                bedId
            ]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_BED',
            module: 'BED_MANAGEMENT',
            entityId: bedId,
            details: { changes: req.body, patientId: newPatientId },
            beforeState: currentState.rows[0],
            afterState: result.rows[0],
            ipAddress: req.ip
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating bed:', err);
        res.status(500).json({ error: 'Failed to update bed' });
    }
};

/**
 * Delete bed
 */
export const deleteBed = async (req, res) => {
    try {
        const { bedId } = req.params;
        const userId = req.user?.id || 1;

        // Check if bed is occupied
        const bedCheck = await query(
            'SELECT * FROM beds WHERE bed_id_str = $1',
            [bedId]
        );

        if (bedCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bed not found' });
        }

        if (bedCheck.rows[0].status === 'OCCUPIED') {
            return res.status(400).json({
                error: 'Cannot delete occupied bed. Please release the bed first.'
            });
        }

        await query('DELETE FROM beds WHERE bed_id_str = $1', [bedId]);

        await logAdminAction({
            userId,
            action: 'DELETE_BED',
            module: 'BED_MANAGEMENT',
            entityId: bedId,
            details: { bedId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({ message: 'Bed deleted successfully' });
    } catch (err) {
        console.error('Error deleting bed:', err);
        res.status(500).json({ error: 'Failed to delete bed' });
    }
};

/**
 * Get bed availability summary
 */
export const getBedAvailability = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                ward_name,
                type as bed_type,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available,
                COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) as occupied,
                COUNT(CASE WHEN status = 'RESERVED' THEN 1 END) as reserved,
                COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as maintenance
            FROM beds
            GROUP BY ward_name, type
            ORDER BY ward_name, type
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bed availability:', err);
        res.status(500).json({ error: 'Failed to fetch bed availability' });
    }
};

/**
 * Get bed types
 */
export const getBedTypes = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM bed_types WHERE is_active = true ORDER BY bed_type_name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bed types:', err);
        res.status(500).json({ error: 'Failed to fetch bed types' });
    }
};

/**
 * Create bed type
 */
export const createBedType = async (req, res) => {
    try {
        const {
            bedTypeId,
            bedTypeName,
            description,
            basePrice,
            features
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO bed_types 
            (bed_type_id, bed_type_name, description, base_price, features)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                bedTypeId,
                bedTypeName,
                description,
                basePrice,
                JSON.stringify(features || [])
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_BED_TYPE',
            module: 'BED_MANAGEMENT',
            entityId: bedTypeId,
            details: { bedTypeName },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating bed type:', err);
        res.status(500).json({ error: 'Failed to create bed type' });
    }
};

/**
 * Get bed assignment rules
 */
export const getBedAssignmentRules = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM bed_assignment_rules WHERE is_active = true ORDER BY priority DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bed assignment rules:', err);
        res.status(500).json({ error: 'Failed to fetch bed assignment rules' });
    }
};

/**
 * Create bed assignment rule
 */
export const createBedAssignmentRule = async (req, res) => {
    try {
        const {
            ruleId,
            ruleName,
            priority,
            conditions,
            actions
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO bed_assignment_rules 
            (rule_id, rule_name, priority, conditions, actions, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                ruleId,
                ruleName,
                priority,
                JSON.stringify(conditions),
                JSON.stringify(actions),
                userId
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_BED_RULE',
            module: 'BED_MANAGEMENT',
            entityId: ruleId,
            details: { ruleName, priority },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating bed assignment rule:', err);
        res.status(500).json({ error: 'Failed to create bed assignment rule' });
    }
};

/**
 * Update bed assignment rule
 */
export const updateBedAssignmentRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const {
            ruleName,
            priority,
            conditions,
            actions,
            isActive
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `UPDATE bed_assignment_rules 
            SET rule_name = COALESCE($1, rule_name),
                priority = COALESCE($2, priority),
                conditions = COALESCE($3, conditions),
                actions = COALESCE($4, actions),
                is_active = COALESCE($5, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE rule_id = $6
            RETURNING *`,
            [
                ruleName,
                priority,
                conditions ? JSON.stringify(conditions) : null,
                actions ? JSON.stringify(actions) : null,
                isActive,
                ruleId
            ]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_BED_RULE',
            module: 'BED_MANAGEMENT',
            entityId: ruleId,
            details: { changes: req.body },
            ipAddress: req.ip
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating bed assignment rule:', err);
        res.status(500).json({ error: 'Failed to update bed assignment rule' });
    }
};

/**
 * Get bed assignment history
 */
export const getBedAssignmentHistory = async (req, res) => {
    try {
        const { patientId, bedId, status } = req.query;

        let queryText = `
            SELECT ba.*, 
                   p.first_name, p.last_name,
                   b.ward_name, b.type as bed_type,
                   u1.full_name as assigned_by_name,
                   u2.full_name as released_by_name
            FROM bed_assignments ba
            LEFT JOIN patients p ON ba.patient_id = p.patient_id_str
            LEFT JOIN beds b ON ba.bed_id = b.bed_id_str
            LEFT JOIN users u1 ON ba.assigned_by = u1.id
            LEFT JOIN users u2 ON ba.released_by = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            params.push(patientId);
            queryText += ` AND ba.patient_id = $${params.length}`;
        }

        if (bedId) {
            params.push(bedId);
            queryText += ` AND ba.bed_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            queryText += ` AND ba.status = $${params.length}`;
        }

        queryText += ' ORDER BY ba.assigned_at DESC LIMIT 100';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bed assignment history:', err);
        res.status(500).json({ error: 'Failed to fetch bed assignment history' });
    }
};
