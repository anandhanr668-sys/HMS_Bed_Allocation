import { query } from '../../config/db.js';

// Get all lab orders assigned to the logged-in lab assistant
export const getMyAssignments = async (req, res) => {
    try {
        const labAssistantId = req.user.id;

        const result = await query(`
            SELECT 
                lo.*, 
                p.first_name, p.last_name, p.age, p.gender,
                ltc.test_name, ltc.category,
                u.full_name as ordered_by_name
            FROM lab_orders lo
            JOIN patients p ON lo.patient_id = p.patient_id_str
            JOIN lab_test_catalog ltc ON lo.test_code = ltc.test_code
            JOIN users u ON lo.ordered_by = u.id
            WHERE lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS')
               OR (lo.status = 'COMPLETED' AND lo.completed_at >= CURRENT_DATE)
            ORDER BY 
                CASE WHEN lo.status IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS') THEN 0 ELSE 1 END,
                CASE WHEN lo.assigned_to = $1 THEN 0 ELSE 1 END,
                CASE lo.priority
                    WHEN 'STAT' THEN 1
                    WHEN 'URGENT' THEN 2
                    WHEN 'ROUTINE' THEN 3
                END,
                lo.ordered_at DESC
        `, [labAssistantId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get assignments error:', err);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

// Get specific lab order details
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const labAssistantId = req.user.id;

        // Verify assignment or allow unassigned orders
        const orderCheck = await query(
            'SELECT * FROM lab_orders WHERE order_id = $1 AND (assigned_to = $2 OR assigned_to IS NULL)',
            [orderId, labAssistantId]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to access this order' });
        }

        const order = orderCheck.rows[0];

        // Get patient details
        const patientResult = await query(
            'SELECT * FROM patients WHERE patient_id_str = $1',
            [order.patient_id]
        );

        // Get test details
        const testResult = await query(
            'SELECT * FROM lab_test_catalog WHERE test_code = $1',
            [order.test_code]
        );

        // Get form schema if exists
        let formSchema = null;
        if (testResult.rows[0].form_schema_id) {
            const schemaResult = await query(
                'SELECT * FROM form_schemas WHERE form_id = $1',
                [testResult.rows[0].form_schema_id]
            );
            formSchema = schemaResult.rows[0]?.schema;
        }

        res.json({
            order: order,
            patient: patientResult.rows[0],
            test: testResult.rows[0],
            formSchema: formSchema
        });
    } catch (err) {
        console.error('Get order details error:', err);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

// Submit lab report
export const submitReport = async (req, res) => {
    try {
        const { orderId, reportData, semenAnalysisData } = req.body;
        const labAssistantId = req.user.id;

        console.log('[LAB] Submit Report Request:', { orderId, labAssistantId });
        console.log('[LAB] Report Data:', reportData);
        console.log('[LAB] Semen Analysis Data:', semenAnalysisData);

        // Get the order (any lab assistant can submit)
        const orderCheck = await query(
            'SELECT * FROM lab_orders WHERE order_id = $1',
            [orderId]
        );

        if (orderCheck.rows.length === 0) {
            console.log('[LAB] Order not found:', orderId);
            return res.status(404).json({ error: 'Lab order not found' });
        }

        const order = orderCheck.rows[0];
        const reportId = `REP-${Date.now()}`;

        console.log('[LAB] Order found:', order);
        console.log('[LAB] Generated Report ID:', reportId);

        // Check if lab_reports table exists, if not, update lab_orders directly
        try {
            // Try to insert into lab_reports
            await query(`
                INSERT INTO lab_reports (
                    report_id, order_id, patient_id, test_code,
                    report_data, performed_by, status,
                    sample_collection_time, examination_time
                ) VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', $7, $8)
            `, [
                reportId,
                orderId,
                order.patient_id,
                order.test_code,
                JSON.stringify(reportData),
                labAssistantId,
                reportData.collection_time,
                reportData.examination_time
            ]);
            console.log('[LAB] Inserted into lab_reports');
        } catch (tableErr) {
            console.log('[LAB] lab_reports table may not exist, using lab_orders.results instead');
            // Fallback: Store in lab_orders.results field
        }

        // If Semen Analysis, try to insert structured data
        if (order.test_code === 'SEMEN_ANALYSIS' && semenAnalysisData) {
            try {
                await query(`
                    INSERT INTO semen_analysis_reports (
                        report_id, patient_id,
                        sample_collection_type, collection_time, examination_time, abstinence_period,
                        volume_ml, appearance, viscosity, ph, liquefaction_time_min,
                        sperm_concentration, total_sperm_count,
                        progressive_motility_pct, non_progressive_motility_pct, immotile_pct,
                        vitality_pct, agglutination, pus_cells_hpf,
                        normal_forms_pct, head_abnormalities_pct, midpiece_abnormalities_pct, tail_abnormalities_pct,
                        technician_name, technician_signature
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
                    )
                `, [
                    reportId,
                    order.patient_id,
                    semenAnalysisData.sample_collection_type,
                    semenAnalysisData.collection_time,
                    semenAnalysisData.examination_time,
                    semenAnalysisData.abstinence_period,
                    semenAnalysisData.volume,
                    semenAnalysisData.appearance,
                    semenAnalysisData.viscosity,
                    semenAnalysisData.ph,
                    semenAnalysisData.liquefaction_time,
                    semenAnalysisData.sperm_concentration,
                    semenAnalysisData.total_sperm_count,
                    semenAnalysisData.progressive_motility,
                    semenAnalysisData.non_progressive_motility,
                    semenAnalysisData.immotile,
                    semenAnalysisData.vitality,
                    semenAnalysisData.agglutination === 'Present',
                    semenAnalysisData.pus_cells_hpf,
                    semenAnalysisData.normal_forms,
                    semenAnalysisData.head_abnormalities,
                    semenAnalysisData.midpiece_abnormalities,
                    semenAnalysisData.tail_abnormalities,
                    reportData.technician_name,
                    reportData.technician_signature
                ]);
                console.log('[LAB] Inserted into semen_analysis_reports');
            } catch (semenErr) {
                console.log('[LAB] semen_analysis_reports table may not exist, storing in lab_orders.results');
            }
        }

        // Update order status and store results in lab_orders
        const resultsData = {
            ...reportData,
            ...(semenAnalysisData || {}),
            reportId,
            submittedBy: labAssistantId,
            submittedAt: new Date().toISOString()
        };

        await query(
            'UPDATE lab_orders SET status = $1, results = $2, completed_at = CURRENT_TIMESTAMP, assigned_technician_id = $3 WHERE order_id = $4',
            ['COMPLETED', JSON.stringify(resultsData), labAssistantId, orderId]
        );

        console.log('[LAB] Updated lab_orders with results');

        // Try audit log (optional)
        try {
            await query(`
                INSERT INTO lab_audit_log (order_id, report_id, action, performed_by, details)
                VALUES ($1, $2, 'REPORT_SUBMITTED', $3, $4)
            `, [
                orderId,
                reportId,
                labAssistantId,
                JSON.stringify({ test_code: order.test_code, timestamp: new Date() })
            ]);
        } catch (auditErr) {
            console.log('[LAB] Audit log table may not exist, skipping');
        }

        res.status(201).json({
            success: true,
            reportId: reportId,
            message: 'Report submitted successfully'
        });
    } catch (err) {
        console.error('[LAB] Submit report error:', err);
        console.error('[LAB] Error stack:', err.stack);
        res.status(500).json({
            error: 'Failed to submit report',
            details: err.message
        });
    }
};

// Get lab report by ID (for viewing)
export const getReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log('[LAB] Get Report Request:', { reportId, userId, userRole });

        let report = null;
        let semenData = null;
        let patientId = null;

        // Try to get from lab_reports table first
        try {
            const reportResult = await query(
                'SELECT * FROM lab_reports WHERE report_id = $1',
                [reportId]
            );

            if (reportResult.rows.length > 0) {
                report = reportResult.rows[0];
                patientId = report.patient_id;
                console.log('[LAB] Found report in lab_reports table');

                // Get structured data if semen analysis
                if (report.test_code === 'SEMEN_ANALYSIS') {
                    try {
                        const semenResult = await query(
                            'SELECT * FROM semen_analysis_reports WHERE report_id = $1',
                            [reportId]
                        );
                        semenData = semenResult.rows[0];
                        console.log('[LAB] Found semen analysis data');
                    } catch (semenErr) {
                        console.log('[LAB] No semen_analysis_reports table, will use report_data');
                        // Parse from report_data if available
                        if (report.report_data) {
                            semenData = typeof report.report_data === 'string'
                                ? JSON.parse(report.report_data)
                                : report.report_data;
                        }
                    }
                }
            }
        } catch (tableErr) {
            console.log('[LAB] lab_reports table may not exist, checking lab_orders');
        }

        // Fallback: Get from lab_orders.results
        if (!report) {
            console.log('[LAB] Fetching from lab_orders.results');
            const orderResult = await query(
                'SELECT * FROM lab_orders WHERE results::jsonb->\'reportId\' = $1',
                [JSON.stringify(reportId)]
            );

            if (orderResult.rows.length === 0) {
                console.log('[LAB] Report not found in either table');
                return res.status(404).json({ error: 'Report not found' });
            }

            const order = orderResult.rows[0];
            patientId = order.patient_id;

            // Parse results from lab_orders
            const results = typeof order.results === 'string'
                ? JSON.parse(order.results)
                : order.results;

            console.log('[LAB] Found results in lab_orders:', results);

            // Construct report object from lab_orders data
            report = {
                report_id: reportId,
                order_id: order.order_id,
                patient_id: order.patient_id,
                test_code: order.test_code,
                test_name: 'Semen Analysis', // You might want to join with lab_test_catalog
                status: order.status,
                performed_by: results.submittedBy || order.assigned_technician_id,
                performed_by_name: results.technician_name || 'Lab Technician',
                created_at: order.completed_at,
                report_data: results
            };

            // Semen analysis data is in results
            semenData = results;
        }

        // Authorization check
        if (userRole === 'LAB_ASSISTANT' && report.performed_by !== userId) {
            return res.status(403).json({ error: 'Not authorized to view this report' });
        }

        // Get patient info
        const patientResult = await query(
            'SELECT * FROM patients WHERE patient_id_str = $1',
            [patientId]
        );

        console.log('[LAB] Returning report data');

        res.json({
            report: report,
            semenAnalysis: semenData,
            patient: patientResult.rows[0]
        });
    } catch (err) {
        console.error('[LAB] Get report error:', err);
        console.error('[LAB] Error stack:', err.stack);
        res.status(500).json({
            error: 'Failed to fetch report',
            details: err.message
        });
    }
};

export default {
    getMyAssignments,
    getOrderDetails,
    submitReport,
    getReport
};
