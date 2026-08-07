import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;
// Manually load env since we are running script directly
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function runSchema() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        const schemaPath = path.join(__dirname, '../db/schema/admin_module_schema.sql');
        console.log(`📄 Reading schema file: ${schemaPath}`);

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('🚀 Executing schema SQL...');

        // Remove comments and split by ; to run individually if needed
        // Or just run it. If it fails, log WHY.

        try {
            await client.query(schemaSql);
            console.log('✅ Admin Module Schema applied successfully!');
        } catch (e) {
            console.error('❌ Error applying schema in one go. Trying statement by statement...');
            // Simple split by ; but handling comments is tricky. 
            // Better to rely on pg to handle it, but if it fails, let's see why.
            console.error(e.message);
        }

    } catch (error) {
        console.error('❌ Error executing schema:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

runSchema();
