import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// STAFF MANAGEMENT CONTROLLER
// Complete User & Permission Management
// ============================================================

/**
 * Get all staff members
 */
export const getAllStaff = async (req, res) => {
    try {
        const { role, status, department } = req.query;

        let queryText = `
            SELECT u.*, d.dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.dept_id
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            params.push(role);
            queryText += ` AND u.role = $${params.length}`;
        }

        if (status) {
            params.push(status);
            queryText += ` AND u.status = $${params.length}`;
        }

        if (department) {
            params.push(department);
            queryText += ` AND u.department_id = $${params.length}`;
        }

        queryText += ' ORDER BY u.created_at DESC';

        const result = await query(queryText, params);

        // Remove password hash from response
        const staff = result.rows.map(({ password_hash, ...rest }) => rest);

        res.json(staff);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

/**
 * Get staff member by ID
 */
export const getStaffById = async (req, res) => {
    try {
        const { staffId } = req.params;

        const result = await query(
            `SELECT u.*, d.dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.dept_id
            WHERE u.id = $1`,
            [staffId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const { password_hash, ...staff } = result.rows[0];
        res.json(staff);
    } catch (err) {
        console.error('Error fetching staff member:', err);
        res.status(500).json({ error: 'Failed to fetch staff member' });
    }
};

/**
 * Create new staff member
 */
export const createStaff = async (req, res) => {
    try {
        const {
            username,
            password,
            role,
            fullName,
            email,
            phoneNumber,
            departmentId,
            specialization,
            licenseNumber
        } = req.body;

        const userId = req.user?.id || 1;

        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({
                error: 'Username, password, and role are required'
            });
        }

        // Check if username already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate staff ID
        const staffIdResult = await query(
            `SELECT 'STAFF' || LPAD(CAST(COALESCE(MAX(CAST(SUBSTRING(staff_id FROM 6) AS INTEGER)), 0) + 1 AS TEXT), 6, '0') as next_staff_id
            FROM users WHERE staff_id IS NOT NULL`
        );
        const staffId = staffIdResult.rows[0].next_staff_id;

        // Create user
        const result = await query(
            `INSERT INTO users 
            (username, password_hash, role, full_name, email, phone_number, 
             department_id, specialization, license_number, staff_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
            RETURNING id, username, role, full_name, email, phone_number, 
                      department_id, specialization, license_number, staff_id, status`,
            [
                username,
                passwordHash,
                role,
                fullName,
                email,
                phoneNumber,
                departmentId,
                specialization,
                licenseNumber,
                staffId
            ]
        );

        const newStaff = result.rows[0];

        // Create credential entries for multiple login options
        await query(
            `INSERT INTO staff_credentials (user_id, credential_type, credential_value, is_primary)
            VALUES 
                ($1, 'STAFF_ID', $2, true),
                ($1, 'USERNAME', $3, false)`,
            [newStaff.id, staffId, username]
        );

        if (phoneNumber) {
            await query(
                `INSERT INTO staff_credentials (user_id, credential_type, credential_value, is_primary)
                VALUES ($1, 'PHONE', $2, false)`,
                [newStaff.id, phoneNumber]
            );
        }

        await logAdminAction({
            userId,
            action: 'CREATE_STAFF',
            module: 'STAFF',
            entityId: newStaff.id,
            details: { username, role, fullName, staffId },
            ipAddress: req.ip
        });

        res.status(201).json(newStaff);
    } catch (err) {
        console.error('Error creating staff:', err);
        res.status(500).json({ error: 'Failed to create staff member' });
    }
};

/**
 * Update staff member
 */
export const updateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const {
            fullName,
            email,
            phoneNumber,
            departmentId,
            specialization,
            licenseNumber,
            status
        } = req.body;

        const userId = req.user?.id || 1;

        // Get current state
        const currentState = await query(
            'SELECT * FROM users WHERE id = $1',
            [staffId]
        );

        if (currentState.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const result = await query(
            `UPDATE users 
            SET full_name = COALESCE($1, full_name),
                email = COALESCE($2, email),
                phone_number = COALESCE($3, phone_number),
                department_id = COALESCE($4, department_id),
                specialization = COALESCE($5, specialization),
                license_number = COALESCE($6, license_number),
                status = COALESCE($7, status)
            WHERE id = $8
            RETURNING id, username, role, full_name, email, phone_number, 
                      department_id, specialization, license_number, staff_id, status`,
            [
                fullName,
                email,
                phoneNumber,
                departmentId,
                specialization,
                licenseNumber,
                status,
                staffId
            ]
        );

        await logAdminAction({
            userId,
            action: 'UPDATE_STAFF',
            module: 'STAFF',
            entityId: staffId,
            details: { changes: req.body },
            beforeState: currentState.rows[0],
            afterState: result.rows[0],
            ipAddress: req.ip
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating staff:', err);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
};

/**
 * Toggle staff status (activate/deactivate)
 */
export const toggleStaffStatus = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { status } = req.body; // 'ACTIVE' or 'INACTIVE'

        const userId = req.user?.id || 1;

        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be ACTIVE or INACTIVE'
            });
        }

        await query(
            'UPDATE users SET status = $1 WHERE id = $2',
            [status, staffId]
        );

        await logAdminAction({
            userId,
            action: 'TOGGLE_STAFF_STATUS',
            module: 'STAFF',
            entityId: staffId,
            details: { newStatus: status },
            ipAddress: req.ip,
            severity: status === 'INACTIVE' ? 'WARNING' : 'INFO'
        });

        res.json({ message: `Staff status updated to ${status}` });
    } catch (err) {
        console.error('Error toggling staff status:', err);
        res.status(500).json({ error: 'Failed to update staff status' });
    }
};

/**
 * Reset staff password
 */
export const resetStaffPassword = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { newPassword } = req.body;

        const userId = req.user?.id || 1;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, staffId]
        );

        await logAdminAction({
            userId,
            action: 'RESET_PASSWORD',
            module: 'STAFF',
            entityId: staffId,
            details: { staffId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

/**
 * Delete staff member (soft delete)
 */
export const deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const userId = req.user?.id || 1;

        // Don't allow deleting yourself
        if (parseInt(staffId) === userId) {
            return res.status(400).json({
                error: 'Cannot delete your own account'
            });
        }

        try {
            // 1. Delete credentials first (these are safe to hard delete)
            await query('DELETE FROM staff_credentials WHERE user_id = $1', [staffId]);
            await query('DELETE FROM staff_permissions WHERE user_id = $1', [staffId]);

            // 2. Attempt Hard Delete from users
            // This will fail if there are foreign key constraints (visits, notes, etc)
            await query('DELETE FROM users WHERE id = $1', [staffId]);

            await logAdminAction({
                userId,
                action: 'DELETE_STAFF_HARD',
                module: 'STAFF',
                entityId: staffId,
                details: { staffId, mode: 'HARD' },
                ipAddress: req.ip,
                severity: 'CRITICAL'
            });

            return res.json({ message: 'Staff member completely removed' });
        } catch (dbErr) {
            // 3. Fallback to Soft Delete if history exists
            console.log('History exists, falling back to soft delete for staff ID:', staffId);

            await query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['INACTIVE', staffId]
            );

            await logAdminAction({
                userId,
                action: 'DELETE_STAFF',
                module: 'STAFF',
                entityId: staffId,
                details: { staffId, mode: 'SOFT' },
                ipAddress: req.ip,
                severity: 'CRITICAL'
            });

            res.json({ message: 'Staff member deactivated (history preserved)' });
        }
    } catch (err) {
        console.error('Error deleting staff:', err);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
};

/**
 * Get all departments
 */
export const getAllDepartments = async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, COUNT(u.id) as staff_count
            FROM departments d
            LEFT JOIN users u ON d.dept_id = u.department_id AND u.status = 'ACTIVE'
            WHERE d.is_active = true
            GROUP BY d.id
            ORDER BY d.dept_name`
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

/**
 * Create department
 */
export const createDepartment = async (req, res) => {
    try {
        const { deptId, deptName, description } = req.body;
        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO departments (dept_id, dept_name, description)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [deptId, deptName, description]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_DEPARTMENT',
            module: 'STAFF',
            entityId: deptId,
            details: { deptName },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating department:', err);
        res.status(500).json({ error: 'Failed to create department' });
    }
};

/**
 * Get staff permissions
 */
export const getStaffPermissions = async (req, res) => {
    try {
        const { staffId } = req.params;

        const result = await query(
            `SELECT sp.*, u.full_name as granted_by_name
            FROM staff_permissions sp
            LEFT JOIN users u ON sp.granted_by = u.id
            WHERE sp.user_id = $1
            ORDER BY sp.module, sp.permission`,
            [staffId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching staff permissions:', err);
        res.status(500).json({ error: 'Failed to fetch staff permissions' });
    }
};

/**
 * Grant staff permission
 */
export const grantStaffPermission = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { module, permission } = req.body;
        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO staff_permissions (user_id, module, permission, granted_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, module, permission) DO NOTHING
            RETURNING *`,
            [staffId, module, permission, userId]
        );

        await logAdminAction({
            userId,
            action: 'GRANT_PERMISSION',
            module: 'STAFF',
            entityId: staffId,
            details: { module, permission },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error granting permission:', err);
        res.status(500).json({ error: 'Failed to grant permission' });
    }
};

/**
 * Revoke staff permission
 */
export const revokeStaffPermission = async (req, res) => {
    try {
        const { staffId, permissionId } = req.params;
        const userId = req.user?.id || 1;

        const result = await query(
            'DELETE FROM staff_permissions WHERE id = $1 AND user_id = $2 RETURNING *',
            [permissionId, staffId]
        );

        await logAdminAction({
            userId,
            action: 'REVOKE_PERMISSION',
            module: 'STAFF',
            entityId: staffId,
            details: { permissionId },
            ipAddress: req.ip,
            severity: 'WARNING'
        });

        res.json({ message: 'Permission revoked successfully' });
    } catch (err) {
        console.error('Error revoking permission:', err);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
};

/**
 * Get staff credentials (for multiple login options)
 */
export const getStaffCredentials = async (req, res) => {
    try {
        const { staffId } = req.params;

        const result = await query(
            'SELECT id, credential_type, credential_value, is_primary FROM staff_credentials WHERE user_id = $1',
            [staffId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching staff credentials:', err);
        res.status(500).json({ error: 'Failed to fetch staff credentials' });
    }
};

/**
 * Get staff statistics
 */
export const getStaffStatistics = async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_staff,
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_staff,
                COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_staff,
                COUNT(CASE WHEN role = 'DOCTOR' THEN 1 END) as doctors,
                COUNT(CASE WHEN role = 'NURSE' THEN 1 END) as nurses,
                COUNT(CASE WHEN role = 'FRONT_DESK' THEN 1 END) as front_desk,
                COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
            FROM users
        `);

        const departmentStats = await query(`
            SELECT d.dept_name, COUNT(u.id) as staff_count
            FROM departments d
            LEFT JOIN users u ON d.dept_id = u.department_id AND u.status = 'ACTIVE'
            WHERE d.is_active = true
            GROUP BY d.dept_name
            ORDER BY staff_count DESC
        `);

        res.json({
            overall: stats.rows[0],
            byDepartment: departmentStats.rows
        });
    } catch (err) {
        console.error('Error fetching staff statistics:', err);
        res.status(500).json({ error: 'Failed to fetch staff statistics' });
    }
};
