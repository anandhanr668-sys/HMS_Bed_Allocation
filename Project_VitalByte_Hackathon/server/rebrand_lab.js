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

async function rebrandLabOrders() {
    try {
        console.log('--- Rebranding lab_orders entries ---');

        // 1. Check if test_type exists and test_code doesn't
        const cols = await pool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'lab_orders'
        `);
        const names = cols.rows.map(r => r.column_name);

        if (names.includes('test_type') && !names.includes('test_code')) {
            console.log('Renaming test_type to test_code...');
            await pool.query('ALTER TABLE lab_orders RENAME COLUMN test_type TO test_code');
        } else if (names.includes('test_type') && names.includes('test_code')) {
            console.log('Dropping test_type as test_code already exists...');
            await pool.query('ALTER TABLE lab_orders DROP COLUMN test_type');
        }

        // 2. Ensure all other required columns are there
        const required = [
            ['patient_id', 'VARCHAR(50)'],
            ['ordered_by', 'INT'],
            ['assigned_to', 'INT'],
            ['priority', 'VARCHAR(20) DEFAULT \'ROUTINE\''],
            ['status', 'VARCHAR(30) DEFAULT \'PENDING\''],
            ['notes', 'TEXT']
        ];

        for (const [name, type] of required) {
            if (!names.includes(name)) {
                await pool.query(`ALTER TABLE lab_orders ADD COLUMN ${name} ${type}`);
            }
        }

        // 3. Make patient_id NOT NULL if it isn't
        await pool.query('ALTER TABLE lab_orders ALTER COLUMN patient_id SET NOT NULL');

        console.log('✅ lab_orders rebranding complete.');
    } catch (err) {
        console.error('❌ Rebranding failed:', err.message);
    } finally {
        await pool.end();
    }
}
rebrandLabOrders();
