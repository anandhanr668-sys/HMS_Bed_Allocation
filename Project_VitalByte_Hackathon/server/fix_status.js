
import { query } from './config/db.js';

const run = async () => {
    try {
        await query("UPDATE visits SET status = 'WAITING_DOCTOR' WHERE status = 'AT_NURSE'");
        console.log('Updated all AT_NURSE visits to WAITING_DOCTOR');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};
run();
