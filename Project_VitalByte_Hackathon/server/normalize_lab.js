import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function normalizeLabOrders() {
    try {
        console.log('--- Normalizing lab_orders Table ---');

        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lab_orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE NOT NULL
            )
        `);

        // Check columns
        const cols = await pool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'lab_orders'
        `);
        const colNames = cols.rows.map(r => r.column_name);
        console.log('Current cols:', colNames);

        const required = [
            ['patient_id', 'VARCHAR(50)'],
            ['test_code', 'VARCHAR(50)'],
            ['ordered_by', 'INT'],
            ['assigned_to', 'INT'],
            ['priority', 'VARCHAR(20) DEFAULT \'ROUTINE\''],
            ['status', 'VARCHAR(30) DEFAULT \'PENDING\''],
            ['ordered_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'],
            ['completed_at', 'TIMESTAMP'],
            ['notes', 'TEXT']
        ];

        for (const [name, type] of required) {
            if (!colNames.includes(name)) {
                console.log(`Adding ${name}...`);
                await pool.query(`ALTER TABLE lab_orders ADD COLUMN ${name} ${type}`);
            }
        }

        console.log('✅ lab_orders normalized.');

        // Now do lab_audit_log
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lab_audit_log (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50),
                action VARCHAR(100),
                performed_by INT,
                details JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ lab_audit_log verified.');

    } catch (err) {
        console.error('❌ Normalization failed:', err);
    } finally {
        await pool.end();
    }
}

normalizeLabOrders();
