import { query } from '../../config/db.js';

// Get orders assigned to the current technician
export const getAssignedOrders = async (req, res) => {
    const { technicianId } = req.params;
    try {
        const result = await query(
            `SELECT lo.*, p.first_name, p.last_name, p.gender, p.age 
             FROM lab_orders lo
             JOIN visits v ON lo.visit_id = v.visit_id
             JOIN patients p ON v.patient_id = p.patient_id_str
             WHERE lo.assigned_technician_id = $1 AND lo.status != 'COMPLETED'`,
            [technicianId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch assigned orders' });
    }
};

// Enter results and complete order
export const submitLabResult = async (req, res) => {
    const { orderId, results, technicianId } = req.body;
    try {
        await query('BEGIN');

        await query(
            `UPDATE lab_orders 
             SET results = $1, status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, technician_id = $2
             WHERE order_id = $3`,
            [JSON.stringify(results), technicianId, orderId]
        );

        // Check if all lab orders for this visit are completed
        const visitResult = await query(`SELECT visit_id FROM lab_orders WHERE order_id = $1`, [orderId]);
        const visitId = visitResult.rows[0].visit_id;

        const pendingOrders = await query(`SELECT * FROM lab_orders WHERE visit_id = $1 AND status != 'COMPLETED'`, [visitId]);

        if (pendingOrders.rows.length === 0) {
            await query(`UPDATE visits SET status = 'BILLING_PENDING' WHERE visit_id = $1`, [visitId]);
        }

        await query('COMMIT');
        res.json({ message: 'Lab result submitted' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to submit lab result' });
    }
};
