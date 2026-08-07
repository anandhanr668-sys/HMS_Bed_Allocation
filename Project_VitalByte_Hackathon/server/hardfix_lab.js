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

async function hardfixLabOrders() {
    try {
        console.log('--- Hard-fixing lab_orders Columns ---');

        const queries = [
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50)',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS test_code VARCHAR(50)',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS ordered_by INT',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS assigned_to INT',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT \'ROUTINE\'',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT \'PENDING\'',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS notes TEXT',
            'ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];

        for (const q of queries) {
            try {
                await pool.query(q);
                console.log(`✅ ${q}`);
            } catch (e) {
                console.error(`❌ ${q} failed: ${e.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
hardfixLabOrders();
