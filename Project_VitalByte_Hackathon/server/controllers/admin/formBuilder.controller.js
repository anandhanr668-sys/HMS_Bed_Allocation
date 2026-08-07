import { query } from '../../config/db.js';
import { logAdminAction } from '../../utils/auditLogger.js';

// ============================================================
// FORM BUILDER CONTROLLER
// No-Code Form Configuration & Management
// ============================================================

/**
 * Get all form templates
 */
export const getAllFormTemplates = async (req, res) => {
    try {
        const { type, isActive } = req.query;

        let queryText = 'SELECT * FROM clinical_forms WHERE 1=1';
        const params = [];

        if (type) {
            params.push(type);
            queryText += ` AND form_type = $${params.length}`;
        }

        if (isActive !== undefined) {
            params.push(isActive === 'true');
            queryText += ` AND is_active = $${params.length}`;
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching clinical forms:', err);
        res.status(500).json({ error: 'Failed to fetch clinical forms' });
    }
};

/**
 * Get form template by ID
 */
export const getFormTemplateById = async (req, res) => {
    try {
        const { formId } = req.params;

        const result = await query(
            'SELECT * FROM clinical_forms WHERE form_code = $1',
            [formId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clinical form not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching clinical form:', err);
        res.status(500).json({ error: 'Failed to fetch clinical form' });
    }
};

/**
 * Create new form template
 */
export const createFormTemplate = async (req, res) => {
    try {
        const {
            formId,
            formName,
            formType,
            schema,
            uiConfig,
            version
        } = req.body;

        const userId = req.user?.id || 1;

        const result = await query(
            `INSERT INTO clinical_forms 
            (form_code, form_name, form_type, schema_json, ui_config, version_id, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                formId,
                formName,
                formType,
                JSON.stringify(schema),
                JSON.stringify(uiConfig || {}),
                version || '1.0',
                true,
                userId
            ]
        );

        await logAdminAction({
            userId,
            action: 'CREATE_CLINICAL_FORM',
            module: 'FORMS',
            entityId: formId,
            details: { formName, formType },
            ipAddress: req.ip
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('CRITICAL Error creating clinical form:', err);
        try {
            const fs = await import('fs');
            fs.appendFileSync('error.log', `\n[${new Date().toISOString()}] CREATE ERROR: ${err.message}\n${err.stack}\n`);
        } catch (e) { }

        res.status(500).json({
            error: 'Failed to create clinical form',
            details: err.message
        });
    }
};

/**
 * Update form template
 */
export const updateFormTemplate = async (req, res) => {
    try {
        const { formId } = req.params;
        const {
            formName,
            schema,
            uiConfig,
            isActive
        } = req.body;

        const userId = req.user?.id || 1;

        // Get current state for audit
        const currentState = await query(
            'SELECT * FROM clinical_forms WHERE form_code = $1',
            [formId]
        );

        const result = await query(
            `UPDATE clinical_forms 
            SET form_name = COALESCE($1, form_name),
                schema_json = COALESCE($2::jsonb, schema_json),
                ui_config = COALESCE($3::jsonb, ui_config),
                is_active = COALESCE($4, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE form_code = $5
            RETURNING *`,
            [
                formName,
                schema ? JSON.stringify(schema) : null,
                uiConfig ? JSON.stringify(uiConfig) : null,
                isActive !== undefined ? isActive : null,
                formId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: `Clinical Protocol '${formId}' not found.` });
        }

        await logAdminAction({
            userId,
            action: 'UPDATE_CLINICAL_FORM',
            module: 'FORMS',
            entityId: formId,
            details: {
                formName,
                changes: req.body
            },
            beforeState: currentState.rows[0],
            afterState: result.rows[0],
            ipAddress: req.ip
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('CRITICAL Error updating clinical form:', err);
        try {
            const fs = await import('fs');
            fs.appendFileSync('error.log', `\n[${new Date().toISOString()}] UPDATE ERROR: ${err.message}\n${err.stack}\n`);
        } catch (e) { }

        res.status(500).json({
            error: 'Failed to update clinical form',
            details: err.message
        });
    }
};

/**
 * Publish form template to modules
 */
export const publishFormTemplate = async (req, res) => {
    try {
        const { formId } = req.params;
        const { publishTo } = req.body;

        // Fetch current protocol
        const currentResult = await query(
            'SELECT ui_config, form_name FROM clinical_forms WHERE form_code = $1',
            [formId]
        );

        let mergedUiConfig = {};
        if (currentResult.rows.length > 0) {
            const row = currentResult.rows[0];
            mergedUiConfig = { ...(row.ui_config || {}), published_to: publishTo || [] };
        } else {
            mergedUiConfig = { published_to: publishTo || [] };
        }

        // Finalize state and visibility
        const result = await query(
            `UPDATE clinical_forms 
             SET ui_config = $1::jsonb,
                 is_active = true,
                 updated_at = CURRENT_TIMESTAMP
             WHERE form_code = $2
             RETURNING *`,
            [JSON.stringify(mergedUiConfig), formId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Publishing Failed',
                details: `Clinical Protocol '${formId}' not found. Please save as draft first.`
            });
        }

        // --- GLOBAL SYNC: Link to Lab Catalog ---
        // If the form name matches a test in our catalog, update the catalog to use this form
        const publishedForm = result.rows[0];
        try {
            await query(
                `UPDATE lab_test_catalog 
                 SET form_code = $1 
                 WHERE LOWER(test_name) = LOWER($2) 
                    OR test_code = $1 
                    OR form_code = $1`,
                [formId, publishedForm.form_name]
            );
            console.log(`[SYNC] Linked Lab Catalog to published form: ${formId}`);
        } catch (syncErr) {
            console.error('[SYNC ERROR] Failed to update lab catalog mapping:', syncErr);
        }

        res.json({
            message: 'Protocol deployed successfully and synced with Lab Catalog',
            form: publishedForm
        });
    } catch (err) {
        console.error('CRITICAL Error publishing clinical form:', err);
        res.status(500).json({
            error: 'Failed to publish clinical form',
            details: err.message
        });
    }
};

/**
 * Archive form version
 */
export const archiveFormVersion = async (req, res) => {
    try {
        const { formId } = req.params;
        const { version, schema, uiConfig } = req.body;

        const result = await query(
            `INSERT INTO form_version_history (form_id, version, schema_json, ui_config)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (form_id, version) 
             DO UPDATE SET 
                schema_json = EXCLUDED.schema_json,
                ui_config = EXCLUDED.ui_config,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [formId, version, JSON.stringify(schema), JSON.stringify(uiConfig)]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('CRITICAL Error archiving clinical form version:', err);
        try {
            const fs = await import('fs');
            fs.appendFileSync('error.log', `\n[${new Date().toISOString()}] ARCHIVE ERROR: ${err.message}\n${err.stack}\n`);
        } catch (e) { }

        res.status(500).json({
            error: 'Failed to archive clinical form version',
            details: err.message
        });
    }
};

/**
 * Get form submissions
 */
export const getFormSubmissions = async (req, res) => {
    try {
        const { formId, patientId, startDate, endDate } = req.query;

        let queryText = `
            SELECT fs.*, p.first_name, p.last_name, u.full_name as submitted_by_name
            FROM form_submissions fs
            LEFT JOIN patients p ON fs.patient_id = p.patient_id_str
            LEFT JOIN users u ON fs.submitted_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (formId) {
            params.push(formId);
            queryText += ` AND fs.form_code = $${params.length}`;
        }

        if (patientId) {
            params.push(patientId);
            queryText += ` AND fs.patient_id = $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            queryText += ` AND fs.submitted_at >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            queryText += ` AND fs.submitted_at <= $${params.length}`;
        }

        queryText += ' ORDER BY fs.submitted_at DESC LIMIT 100';

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching clinical form submissions:', err);
        res.status(500).json({ error: 'Failed to fetch clinical form submissions' });
    }
};

/**
 * Delete form template
 */
export const deleteFormTemplate = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user?.id || 1;

        const result = await query(
            'DELETE FROM clinical_forms WHERE form_code = $1 RETURNING *',
            [formId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Clinical form not found' });
        }

        res.json({ message: 'Clinical form deleted permanently' });
    } catch (err) {
        if (err.code === '23503') {
            await query('UPDATE clinical_forms SET is_active = false WHERE form_code = $1', [req.params.formId]);
            return res.json({ message: 'Form contains data. Deactivated instead of deleted.' });
        }
        res.status(500).json({ error: 'Failed to delete clinical form' });
    }
};

/**
 * Get available field types
 */
export const getFieldTypes = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM form_field_types WHERE is_active = true ORDER BY field_type'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch field types' });
    }
};

/**
 * Preview form
 */
export const previewForm = async (req, res) => {
    try {
        const { formId } = req.params;

        const result = await query(
            'SELECT * FROM clinical_forms WHERE form_code = $1 AND is_active = true',
            [formId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clinical form not found' });
        }

        const form = result.rows[0];

        res.json({
            formId: form.form_code,
            formName: form.form_name,
            schema: form.schema_json,
            uiConfig: form.ui_config
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to preview clinical form' });
    }
};
