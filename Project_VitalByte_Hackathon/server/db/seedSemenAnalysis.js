import { query } from '../config/db.js';

const seedSemenAnalysis = async () => {
    const formId = 'SEMEN_ANALYSIS_STD';
    const formName = 'Semen Analysis Report';

    // Schema matching the detailed clinical screenshot
    const schema = {
        fields: [
            // Metadata
            { id: "sec_Coll", type: "section", label: "COLLECTION DETAILS" },
            { id: "coll_1", type: "row_2", columns: ["Sample Collection Type", "Mode of Collection"], label: "Collection Mode" },
            { id: "coll_2", type: "row_2", columns: ["Time of Collection", "Time of Examination"], label: "Timeline" },
            { id: "coll_3", type: "row_2", columns: ["Abstinence Period", "Complete Collection"], label: "Other Details" },

            // Macroscopic
            { id: "sec_Macro", type: "section", label: "MACROSCOPIC EXAMINATION" },
            { id: "macro_1", type: "row_2", columns: ["Volume", "pH"], label: "Vol & pH" },
            { id: "macro_2", type: "row_2", columns: ["Appearance", "Time of Liquefaction"], label: "App & Liq" },
            { id: "macro_3", type: "text", label: "Viscosity", width: "full" },

            // Microscopic
            { id: "sec_Micro", type: "section", label: "MICROSCOPIC EXAMINATION" },
            { id: "micro_1", type: "row_2", columns: ["Sperm Concentration", "Total Motile Progressive (TMSC)"], label: "Concentration" },
            { id: "micro_2", type: "row_2", columns: ["Total Sperm Number", "Vitality"], label: "Counts" },
            { id: "micro_3", type: "row_2", columns: ["Rapid Progressive Motility(a)", "Slow Progressive Motility(b)"], label: "Motility A/B" },
            { id: "micro_4", type: "row_2", columns: ["Non-Progressive Motility(c)", "Immotile Sperm"], label: "Motility C/D" },
            { id: "micro_5", type: "row_2", columns: ["Agglutination", "Round Cells / HPF"], label: "Other Observation" },
            { id: "micro_6", type: "text", label: "Other Cells / Debris", width: "full" },

            // Morphology
            { id: "sec_Morph", type: "section", label: "MORPHOLOGY" },
            { id: "morph_1", type: "row_2", columns: ["Normal Forms", "Abnormal Forms"], label: "Forms %" },
            { id: "morph_2", type: "row_2", columns: ["Head Abnormalities", "Midpiece Abnormalities"], label: "Structure 1" },
            { id: "morph_3", type: "row_2", columns: ["Tail Abnormalities", "Cytoplasmic Droplets"], label: "Structure 2" }
        ]
    };

    const uiConfig = {
        formLocation: "LAB_INVESTIGATION",
        headerTitle: "ASCAS FERTILITY AND WOMEN'S CENTRE",
        headerSubtitle: "Department of Andrology",
        version: "6.0" // Matching WHO 6th Edition theme
    };

    try {
        // Upsert logic
        const exists = await query('SELECT * FROM form_templates WHERE form_id = $1', [formId]);

        if (exists.rows.length > 0) {
            await query(
                `UPDATE form_templates SET 
                schema = $1, ui_config = $2, updated_at = CURRENT_TIMESTAMP, is_active = true, published_to = $3
                WHERE form_id = $4`,
                [JSON.stringify(schema), JSON.stringify(uiConfig), JSON.stringify(['LAB_ASSISTANT', 'DOCTOR']), formId]
            );
            console.log('✅ Updated Semen Analysis Template');
        } else {
            await query(
                `INSERT INTO form_templates 
                (form_id, form_name, form_type, schema, ui_config, created_by, workflow_location, deployment_status, published_to)
                VALUES ($1, $2, 'LAB_REPORT', $3, $4, 1, 'LAB_INVESTIGATION', 'PUBLISHED', $5)`,
                [formId, formName, JSON.stringify(schema), JSON.stringify(uiConfig), JSON.stringify(['LAB_ASSISTANT', 'DOCTOR'])]
            );
            console.log('✅ Created Semen Analysis Template');
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Error seeding form:', e);
        process.exit(1);
    }
};

seedSemenAnalysis();
