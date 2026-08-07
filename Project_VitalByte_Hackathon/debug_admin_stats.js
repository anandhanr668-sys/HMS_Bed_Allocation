import { query } from './server/config/db.js';

async function testStats() {
    try {
        const whereClause = '::DATE = CURRENT_DATE';

        console.log("Testing patientStats...");
        const patientStats = await query(`
            SELECT 
                (SELECT COUNT(*)::INT FROM patients) as total_patients_all_time,
                (SELECT COUNT(*)::INT FROM patients WHERE registered_at${whereClause}) as patients_in_range,
                (SELECT COUNT(*)::INT FROM patients WHERE status = 'ADMITTED') as currently_admitted,
                (SELECT COUNT(*)::INT FROM protocol_executions WHERE alert_level IN ('HIGH', 'CRITICAL') AND resolution_status = 'PENDING') as high_risk_patients
            FROM (SELECT 1) as dummy
        `);
        console.log("patientStats success:", patientStats.rows[0]);

        console.log("Testing visitStats...");
        const visitStats = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE visit_type = 'OPD' AND check_in_time${whereClause})::INT as opd_count,
                COUNT(*) FILTER (WHERE visit_type = 'IPD' AND check_in_time${whereClause})::INT as ipd_count,
                COUNT(*) FILTER (WHERE visit_type = 'EMERGENCY' AND check_in_time${whereClause})::INT as emergency_count,
                COUNT(*) FILTER (WHERE status != 'CLOSED')::INT as active_visits
            FROM visits
        `);
        console.log("visitStats success:", visitStats.rows[0]);

        console.log("Testing alertStats...");
        const alertStats = await query(`
            SELECT 
                COUNT(*)::INT as total_active_alerts,
                COUNT(*) FILTER (WHERE alert_level = 'CRITICAL')::INT as critical_alerts,
                COUNT(*) FILTER (WHERE alert_level = 'HIGH')::INT as high_alerts
            FROM protocol_executions
            WHERE resolution_status = 'PENDING'
        `);
        console.log("alertStats success:", alertStats.rows[0]);

    } catch (err) {
        console.error("QUERY FAILED!");
        console.error(err);
    } finally {
        process.exit();
    }
}

testStats();
