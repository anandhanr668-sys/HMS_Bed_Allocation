import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function auditLabSystem() {
    try {
        console.log('--- 🛡️ Hospital Lab System Audit ---');

        // 1. Check Lab Test Catalog
        const catalog = await pool.query('SELECT COUNT(*) FROM lab_test_catalog');
        console.log(`✅ Catalog Check: ${catalog.rows[0].count} tests available.`);

        // 2. Check Lab Assistants
        const assistants = await pool.query("SELECT username, email FROM users WHERE role = 'LAB_ASSISTANT' AND status = 'ACTIVE'");
        console.log('✅ Active Lab Assistants:', assistants.rows.map(a => a.username).join(', '));

        // 3. Check Pending Orders
        const pending = await pool.query("SELECT COUNT(*) FROM lab_orders WHERE status = 'PENDING'");
        console.log(`🔍 Pending Orders: ${pending.rows[0].count}`);

        // 4. Check Completed Reports
        const reports = await pool.query("SELECT COUNT(*) FROM lab_reports");
        console.log(`🔍 Completed Reports: ${reports.rows[0].count}`);

        // 5. Verify Semen Analysis Linkage
        const semen = await pool.query("SELECT COUNT(*) FROM semen_analysis_reports");
        console.log(`🔍 Semen Analysis Specialized Records: ${semen.rows[0].count}`);

        console.log('--- Audit Complete ---');
    } catch (err) {
        console.error('❌ Audit Failed:', err.message);
    } finally {
        await pool.end();
    }
}

auditLabSystem();
