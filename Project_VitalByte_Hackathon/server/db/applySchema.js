import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchema() {
    try {
        const schemaPath = path.join(__dirname, 'production_master_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        // Split by semicolon but be careful with functions/triggers. 
        // For this simple schema, splitting by semicolon or running the whole block should work.
        // running as one big query often fails due to multi-statement issues in some drivers, 
        // but pg.query supports it.
        await query(sql);
        console.log('Schema applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    }
}

applySchema();
