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

async function findTableVariations() {
    try {
        const r = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%lab_order%'
        `);
        console.log('Tables found:', r.rows.map(row => row.table_name));

        for (const table of r.rows.map(row => row.table_name)) {
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.log(`Columns in ${table}:`, cols.rows.map(c => `${c.column_name}(${c.data_type})`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
findTableVariations();
