import { query } from './config/db.js';

async function testConn() {
    try {
        const res = await query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != \'pg_catalog\' AND schemaname != \'information_schema\'');
        console.log('Tables:', res.rows.map(r => r.tablename));
        process.exit(0);
    } catch (err) {
        console.error('DB ERROR:', err);
        process.exit(1);
    }
}

testConn();
