import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
    // 1. Initial connection to default 'postgres' database to ensure the target DB exists
    const adminPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    });

    const targetDb = process.env.DB_NAME || 'hms_db';

    try {
        console.log(`--- Checking Database: ${targetDb} ---`);

        // Check if database exists
        const res = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDb}'`);

        if (res.rowCount === 0) {
            console.log(`Database ${targetDb} does not exist. Creating it...`);
            await adminPool.query(`CREATE DATABASE ${targetDb}`);
            console.log(`✅ Database ${targetDb} created.`);
        } else {
            console.log(`✅ Database ${targetDb} already exists.`);
        }
        await adminPool.end();

        // 2. Connect to the target database and run schema
        console.log(`--- Connecting to ${targetDb} to run schema ---`);
        const targetPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: targetDb,
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
        });

        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await targetPool.query(sql);
        console.log('✅ Schema executed successfully. All tables created.');

        await targetPool.end();
        console.log('--- Setup Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Setup Failed:');
        console.error(err.message);
        if (err.code === '28P01') {
            console.error('👉 Hint: Password authentication failed. Please check your .env DB_PASSWORD.');
        }
        process.exit(1);
    }
};

setupDatabase();
