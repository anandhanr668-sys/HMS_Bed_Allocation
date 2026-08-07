import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'hms_db',
    user: 'postgres',
    password: 'asdfghjkl'
});

async function checkBeds() {
    try {
        await client.connect();
        console.log('Connected to database');

        const result = await client.query(`
            SELECT 
                COUNT(*)::INT as total_beds,
                COUNT(*) FILTER (WHERE status = 'AVAILABLE')::INT as available_beds,
                COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied_beds,
                COUNT(*) FILTER (WHERE status = 'CLEANING')::INT as cleaning_beds,
                COUNT(*) FILTER (WHERE status = 'MAINTENANCE')::INT as maintenance_beds
            FROM beds
        `);

        console.log('\n=== DATABASE BED STATUS ===');
        console.log(result.rows[0]);

        const wardBreakdown = await client.query(`
            SELECT 
                ward_name,
                COUNT(*)::INT as total,
                COUNT(*) FILTER (WHERE status = 'AVAILABLE')::INT as available,
                COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied
            FROM beds
            GROUP BY ward_name
            ORDER BY ward_name
        `);

        console.log('\n=== WARD BREAKDOWN ===');
        wardBreakdown.rows.forEach(row => {
            console.log(`${row.ward_name}: ${row.available}/${row.total} available`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkBeds();
