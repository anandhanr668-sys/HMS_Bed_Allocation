import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runUpgrade = async () => {
    try {
        const sqlPath = path.join(__dirname, '../db/schema/revisit_upgrade.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing Revisit Workflow Schema Upgrade...');
        await query(sql);
        console.log('✅ Revisit Schema Applied: Lab Assignment & Sensitive Flags enabled.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Upgrade Failed:', err);
        process.exit(1);
    }
};

runUpgrade();
