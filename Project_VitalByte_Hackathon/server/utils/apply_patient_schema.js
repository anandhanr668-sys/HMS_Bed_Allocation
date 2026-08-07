import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runUpgrade = async () => {
    try {
        const sqlPath = path.join(__dirname, '../db/schema/patient_portal.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing Patient Portal Schema Upgrade...');
        await query(sql);
        console.log('✅ Patient Portal Tables Created Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Upgrade Failed:', err);
        process.exit(1);
    }
};

runUpgrade();
