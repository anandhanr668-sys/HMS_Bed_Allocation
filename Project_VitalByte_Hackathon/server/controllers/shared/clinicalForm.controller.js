import { query } from '../../config/db.js';

/**
 * Get clinical form template by code
 */
export const getClinicalFormByCode = async (req, res) => {
    try {
        const { formCode } = req.params;

        // 1. Check if this code is a TEST in our catalog that is mapped to a specific form
        // This allows admins to update the mapping globally
        const catalogMapping = await query(
            'SELECT form_code FROM lab_test_catalog WHERE test_code = $1 AND form_code IS NOT NULL AND form_code != $1',
            [formCode]
        );

        const targetCode = (catalogMapping.rows.length > 0)
            ? catalogMapping.rows[0].form_code
            : formCode;

        // 2. Fetch the corresponding active clinical form
        const result = await query(
            'SELECT * FROM clinical_forms WHERE form_code = $1 AND is_active = true',
            [targetCode]
        );

        if (result.rows.length === 0) {
            // Final fallback: check the original code if redirection resulted in nothing
            if (targetCode !== formCode) {
                const fallback = await query(
                    'SELECT * FROM clinical_forms WHERE form_code = $1 AND is_active = true',
                    [formCode]
                );
                if (fallback.rows.length > 0) return res.json(fallback.rows[0]);
            }
            return res.status(404).json({ error: 'Clinical form not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching clinical form:', err);
        res.status(500).json({ error: 'Failed to fetch clinical form template' });
    }
};

/**
 * Submit clinical form data
 */
export const submitClinicalForm = async (req, res) => {
    try {
        const {
            formCode,
            versionId,
            patientId,
            orderId,
            visitId,
            fieldValues
        } = req.body;

        const userId = req.user.id;
        const submissionId = `SUB-${Date.now()}`;

        const result = await query(
            `INSERT INTO form_submissions 
            (submission_id, form_code, form_version_id, patient_id, order_id, visit_id, submitted_by, field_values_json)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                submissionId,
                formCode,
                versionId,
                patientId,
                orderId,
                visitId || null,
                userId,
                JSON.stringify(fieldValues)
            ]
        );

        res.status(201).json({
            success: true,
            submissionId: submissionId,
            message: 'Clinical form submitted successfully'
        });
    } catch (err) {
        console.error('Error submitting clinical form:', err);
        res.status(500).json({ error: 'Failed to submit clinical form data' });
    }
};

/**
 * Get submission by ID or related order
 */
export const getSubmission = async (req, res) => {
    try {
        const { submissionId, orderId } = req.query;

        let queryText = 'SELECT fs.*, f.form_name FROM form_submissions fs JOIN clinical_forms f ON fs.form_code = f.form_code WHERE 1=1';
        const params = [];

        if (submissionId) {
            params.push(submissionId);
            queryText += ` AND fs.submission_id = $${params.length}`;
        } else if (orderId) {
            params.push(orderId);
            queryText += ` AND fs.order_id = $${params.length}`;
        } else {
            return res.status(400).json({ error: 'Submission ID or Order ID required' });
        }

        const result = await query(queryText, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching submission:', err);
        res.status(500).json({ error: 'Failed to fetch clinical form submission' });
    }
};
