import { query } from '../../config/db.js';

export const createTransaction = async (req, res) => {
    const { patientId, amount, type, description } = req.body;
    console.log(`[DEBUG] Billing Submission: Patient ${patientId}, Amount: ${amount}`);

    try {
        const result = await query(
            `INSERT INTO transactions (patient_id, amount, type, description) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [patientId, amount, type, description]
        );

        if (!result.rows[0]) {
            throw new Error('Transaction INSERT failed - No rows returned');
        }

        const txn = result.rows[0];

        // Immediate Verification
        const verify = await query('SELECT * FROM transactions WHERE id = $1', [txn.id]);
        if (verify.rows.length === 0) {
            throw new Error('Transaction persistence verification failed');
        }

        console.log(`[SUCCESS] Billing Persisted: Transaction ID ${txn.id}`);
        res.status(201).json(txn);
    } catch (err) {
        console.error('!!! BILLING PERSISTENCE ERROR !!!');
        console.error(err.message);
        res.status(500).json({
            error: 'Failed to persist billing data',
            details: err.message
        });
    }
};

export const getPatientTransactions = async (req, res) => {
    const { patientId } = req.params;
    try {
        const result = await query(
            'SELECT * FROM transactions WHERE patient_id = $1 ORDER BY timestamp DESC',
            [patientId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
