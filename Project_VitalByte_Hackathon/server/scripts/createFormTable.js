import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const createTableSql = `
    CREATE TABLE IF NOT EXISTS form_templates (
        id SERIAL PRIMARY KEY,
        form_id VARCHAR(100) UNIQUE NOT NULL,
        form_name VARCHAR(200) NOT NULL,
        form_type VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL DEFAULT '1.0',
        is_active BOOLEAN DEFAULT TRUE,
        schema JSONB NOT NULL,
        ui_config JSONB,
        published_to JSONB,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP,
        validation_rules JSONB,
        conditional_rules JSONB,
        CONSTRAINT unique_form_version UNIQUE(form_id, version)
    );
`;

async function run() {
    try {
        await client.connect();
        await client.query(createTableSql);
        console.log('✅ form_templates table created!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await client.end();
    }
}

run();
