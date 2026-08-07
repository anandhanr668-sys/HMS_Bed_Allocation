import { query } from './config/db.js';

async function testAdminStatsQueries() {
    const whereClause = '::DATE = CURRENT_DATE';

    const queries = [
        {
            name: 'patientStats',
            sql: `
        SELECT 
            (SELECT COUNT(*)::INT FROM patients) as total_patients_all_time,
            (SELECT COUNT(*)::INT FROM patients WHERE registered_at${whereClause}) as patients_in_range,
            (SELECT COUNT(*)::INT FROM patients WHERE status = 'ADMITTED') as currently_admitted,
            (SELECT COUNT(*)::INT FROM protocol_executions WHERE alert_level IN ('HIGH', 'CRITICAL') AND resolution_status = 'PENDING') as high_risk_patients
        FROM (SELECT 1) as dummy
      `
        },
        {
            name: 'visitStats',
            sql: `
        SELECT 
            COUNT(*) FILTER (WHERE visit_type = 'OPD' AND check_in_time${whereClause})::INT as opd_count,
            COUNT(*) FILTER (WHERE visit_type = 'IPD' AND check_in_time${whereClause})::INT as ipd_count,
            COUNT(*) FILTER (WHERE visit_type = 'EMERGENCY' AND check_in_time${whereClause})::INT as emergency_count,
            COUNT(*) FILTER (WHERE status != 'CLOSED')::INT as active_visits
        FROM visits
      `
        },
        {
            name: 'bedStats',
            sql: `
        SELECT 
            COUNT(*)::INT as total_beds,
            COUNT(*) FILTER (WHERE status = 'AVAILABLE')::INT as available_beds,
            COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied_beds,
            ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_rate
        FROM beds
      `
        },
        {
            name: 'alertStats',
            sql: `
        SELECT 
            COUNT(*)::INT as total_active_alerts,
            COUNT(*) FILTER (WHERE alert_level = 'CRITICAL')::INT as critical_alerts,
            COUNT(*) FILTER (WHERE alert_level = 'HIGH')::INT as high_alerts
        FROM protocol_executions
        WHERE resolution_status = 'PENDING'
      `
        },
        {
            name: 'recentActivity',
            sql: `
        SELECT id, action, module, details, timestamp
        FROM audit_logs
        WHERE timestamp${whereClause}
        ORDER BY timestamp DESC
        LIMIT 15
      `
        },
        {
            name: 'wardOccupancy',
            sql: `
        SELECT 
            ward_name,
            COUNT(*)::INT as total_beds,
            COUNT(*) FILTER (WHERE status = 'OCCUPIED')::INT as occupied,
            ROUND(COUNT(*) FILTER (WHERE status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2)::FLOAT as occupancy_percentage
        FROM beds
        GROUP BY ward_name
        ORDER BY occupancy_percentage DESC
      `
        }
    ];

    for (const q of queries) {
        try {
            console.log(`Testing ${q.name}...`);
            await query(q.sql);
            console.log(`${q.name} OK`);
        } catch (err) {
            console.error(`${q.name} FAILED:`, err.message);
            console.error('SQL:', q.sql);
        }
    }
    process.exit(0);
}

testAdminStatsQueries();
