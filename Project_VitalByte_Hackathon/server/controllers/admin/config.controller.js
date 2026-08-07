import { query } from '../../config/db.js';

// --- FORM BUILDER ---

export const saveFormSchema = async (req, res) => {
    const { formId, title, description, category, schemaJson, uiConfig, targetRoles } = req.body;
    try {
        const result = await query(
            `INSERT INTO form_schemas (form_id, title, description, category, schema_json, ui_config, target_roles) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (form_id) DO UPDATE 
             SET title = EXCLUDED.title, 
                 description = EXCLUDED.description,
                 schema_json = EXCLUDED.schema_json, 
                 ui_config = EXCLUDED.ui_config, 
                 target_roles = EXCLUDED.target_roles,
                 version = form_schemas.version + 1,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [formId, title, description, category, JSON.stringify(schemaJson), JSON.stringify(uiConfig), targetRoles]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save form schema' });
    }
};

export const getFormSchemas = async (req, res) => {
    try {
        const result = await query('SELECT * FROM form_schemas ORDER BY updated_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch forms' });
    }
};

export const deleteFormSchema = async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM form_schemas WHERE form_id = $1', [id]);
        res.json({ message: 'Form deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete form' });
    }
};

export const getPublishedFormsByRole = async (req, res) => {
    const { role } = req.params;
    try {
        // Find forms where target_roles contains the requested role
        const result = await query(
            'SELECT * FROM form_schemas WHERE $1 = ANY(target_roles) AND is_active = TRUE ORDER BY title ASC',
            [role]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch published forms' });
    }
};

// --- PROTOCOL BUILDER ---

export const saveProtocol = async (req, res) => {
    const { name, description, vitalsConditions, alertConfig } = req.body;
    try {
        const result = await query(
            `INSERT INTO protocol_rules (protocol_name, description, vitals_conditions, alert_config)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, description, JSON.stringify(vitalsConditions), JSON.stringify(alertConfig)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save protocol' });
    }
};
