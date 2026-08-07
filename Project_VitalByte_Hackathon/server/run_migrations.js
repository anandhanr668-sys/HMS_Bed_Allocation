import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
    const targetDb = process.env.DB_NAME || 'hms_db';
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: targetDb,
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('--- Running Laboratory Module Migrations ---');
        console.log('Current __dirname:', __dirname);

        // 1. Run Lab Role Migration
        const migrationPath = path.resolve(__dirname, 'db', 'migrations', 'add_lab_role.sql');
        console.log(`Checking path: ${migrationPath}`);
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file does not exist: ${migrationPath}`);
        }
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSql);
        console.log('✅ Role migration completed.');

        // 2. Run Lab Module Schema
        const schemaPath = path.resolve(__dirname, 'db', 'schema', 'lab_module.sql');
        console.log(`Checking path: ${schemaPath}`);
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file does not exist: ${schemaPath}`);
        }
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ Lab module schema completed.');

        await pool.end();
        console.log('--- Migrations Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:');
        console.error(err.message);
        process.exit(1);
    }
};

runMigrations();
