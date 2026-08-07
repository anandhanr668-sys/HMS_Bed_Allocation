import { query } from '../../config/db.js';

// Get lab test catalog (filtered by gender if needed)
export const getLabTestCatalog = async (req, res) => {
    try {
        const { patientGender } = req.query;

        let sql = 'SELECT * FROM lab_test_catalog WHERE is_active = true';
        const params = [];

        if (patientGender) {
            sql += ' AND (gender_restriction = $1 OR gender_restriction = \'ALL\')';
            params.push(patientGender.toUpperCase());
        }

        sql += ' ORDER BY category, test_name';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get lab catalog error:', err);
        res.status(500).json({ error: 'Failed to fetch lab test catalog' });
    }
};

// Create lab order (Doctor only)
export const createLabOrder = async (req, res) => {
    try {
        const { patientId, testCode, assignedTo, priority, notes } = req.body;
        const doctorId = req.user.id;

        // Validate patient gender for gender-restricted tests
        const patientResult = await query(
            'SELECT gender FROM patients WHERE patient_id_str = $1',
            [patientId]
        );

        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const patient = patientResult.rows[0];

        // Check test gender restriction
        const testResult = await query(
            'SELECT * FROM lab_test_catalog WHERE test_code = $1',
            [testCode]
        );

        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found in catalog' });
        }

        const test = testResult.rows[0];

        if (test.gender_restriction !== 'ALL') {
            if (test.gender_restriction === 'MALE' && patient.gender !== 'Male') {
                return res.status(400).json({
                    error: `${test.test_name} is only applicable for male patients`
                });
            }
            if (test.gender_restriction === 'FEMALE' && patient.gender !== 'Female') {
                return res.status(400).json({
                    error: `${test.test_name} is only applicable for female patients`
                });
            }
        }

        // Create order
        const orderId = `LAB-${Date.now()}`;

        await query(`
            INSERT INTO lab_orders (
                order_id, patient_id, test_code, ordered_by, assigned_to, priority, status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
        `, [orderId, patientId, testCode, doctorId, assignedTo || null, priority || 'ROUTINE', notes]);

        // Audit log
        await query(`
            INSERT INTO lab_audit_log (order_id, action, performed_by, details)
            VALUES ($1, 'ORDER_CREATED', $2, $3)
        `, [
            orderId,
            doctorId,
            JSON.stringify({ test_code: testCode, patient_id: patientId })
        ]);

        res.status(201).json({
            success: true,
            orderId: orderId,
            message: 'Lab order created successfully'
        });
    } catch (err) {
        console.error('Create lab order error:', err);
        res.status(500).json({ error: 'Failed to create lab order' });
    }
};

// Get lab orders for a patient (Doctor view)
export const getPatientLabOrders = async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await query(`
            SELECT 
                lo.*,
                ltc.test_name, ltc.category,
                u1.full_name as ordered_by_name,
                u2.full_name as assigned_to_name
            FROM lab_orders lo
            JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code
            JOIN users u1 ON lo.ordered_by = u1.id
            LEFT JOIN users u2 ON lo.assigned_to = u2.id
            WHERE lo.patient_id = $1
            ORDER BY lo.ordered_at DESC
        `, [patientId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get patient lab orders error:', err);
        res.status(500).json({ error: 'Failed to fetch lab orders' });
    }
};

// Get lab reports for a patient (Doctor view)
export const getPatientLabReports = async (req, res) => {
    try {
        const { patientId } = req.params;

        const result = await query(`
            SELECT 
                lr.*,
                ltc.test_name, ltc.category,
                u.full_name as performed_by_name
            FROM lab_reports lr
            JOIN lab_test_catalog ltc ON lr.test_code = ltc.test_code
            JOIN users u ON lr.performed_by = u.id
            WHERE lr.patient_id = $1
            AND lr.status = 'SUBMITTED'
            ORDER BY lr.submitted_at DESC
        `, [patientId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get patient lab reports error:', err);
        res.status(500).json({ error: 'Failed to fetch lab reports' });
    }
};

// Get all lab assistants (for assignment dropdown)
export const getLabAssistants = async (req, res) => {
    try {
        const result = await query(`
            SELECT id, full_name, email, department, specialization
            FROM users
            WHERE role = 'LAB_ASSISTANT' AND status = 'ACTIVE'
            ORDER BY full_name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Get lab assistants error:', err);
        res.status(500).json({ error: 'Failed to fetch lab assistants' });
    }
};

export default {
    getLabTestCatalog,
    createLabOrder,
    getPatientLabOrders,
    getPatientLabReports,
    getLabAssistants
};
