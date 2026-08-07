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

async function fixAuditTable() {
    try {
        console.log('--- Fixing lab_audit_log Table ---');
        
        const queries = [
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS report_id VARCHAR(50)',
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS order_id VARCHAR(50)',
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS action VARCHAR(100)',
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS performed_by INT',
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS details JSONB',
            'ALTER TABLE lab_audit_log ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];

        for (const q of queries) {
            try {
                await pool.query(q);
                console.log(`✅ Success: ${q}`);
            } catch (e) {
                console.error(`❌ Error: ${q} - ${e.message}`);
            }
        }

        console.log('--- Fix Complete ---');
    } catch (err) {
        console.error('❌ Critical Failure:', err.message);
    } finally {
        await pool.end();
    }
}

fixAuditTable();
