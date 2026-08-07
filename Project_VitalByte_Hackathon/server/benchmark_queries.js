import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function runQueries() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: 5433,
    });

    await client.connect();
    console.log('Connected to DB');

    const queries = [
        ['Patient Stats', `SELECT 
                (SELECT COUNT(*)::INT FROM patients) as total_patients_all_time,
                (SELECT COUNT(*)::INT FROM patients WHERE registered_at::DATE = CURRENT_DATE) as patients_in_range,
                (SELECT COUNT(*)::INT FROM patients WHERE status = 'ADMITTED') as currently_admitted,
                (SELECT COUNT(*)::INT FROM protocol_executions WHERE alert_level IN ('HIGH', 'CRITICAL') AND resolution_status = 'PENDING') as high_risk_patients
            FROM (SELECT 1) as dummy`],
        ['Visit Stats', `SELECT 
                COUNT(*) FILTER (WHERE visit_type = 'OPD' AND check_in_time::DATE = CURRENT_DATE)::INT as opd_count,
                COUNT(*) FILTER (WHERE visit_type = 'IPD' AND check_in_time::DATE = CURRENT_DATE)::INT as ipd_count,
                COUNT(*) FILTER (WHERE visit_type = 'EMERGENCY' AND check_in_time::DATE = CURRENT_DATE)::INT as emergency_count,
                COUNT(*) FILTER (WHERE status != 'CLOSED')::INT as active_visits
            FROM visits`],
        ['Bed Stats', `SELECT 
                COUNT(*)::INT as total_beds,
                COUNT(*) FILTER (WHERE status = 'AVAILABLE')::INT as available_beds,
                COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied_beds,
                ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_rate
            FROM beds`],
        ['Alert Stats', `SELECT 
                COUNT(*)::INT as total_active_alerts,
                COUNT(*) FILTER (WHERE alert_level = 'CRITICAL')::INT as critical_alerts,
                COUNT(*) FILTER (WHERE alert_level = 'HIGH')::INT as high_alerts
            FROM protocol_executions
            WHERE resolution_status = 'PENDING'`],
        ['Audit Logs', `SELECT id, action, module, details, timestamp
            FROM audit_logs
            WHERE timestamp::DATE = CURRENT_DATE
            ORDER BY timestamp DESC
            LIMIT 15`],
        ['Ward Occupancy', `SELECT 
                ward_name,
                COUNT(*)::INT as total_beds,
                COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied,
                ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_percentage
            FROM beds
            GROUP BY ward_name
            ORDER BY occupancy_percentage DESC`]
    ];

    for (const [name, sql] of queries) {
        process.stdout.write(`Running ${name}... `);
        const start = Date.now();
        try {
            await client.query(sql);
            console.log(`DONE in ${Date.now() - start}ms`);
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
        }
    }

    await client.end();
}

runQueries();
