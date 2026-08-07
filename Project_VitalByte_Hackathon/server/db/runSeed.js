import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedData() {
    try {
        const seedPath = path.join(__dirname, 'seedRealisticData.sql');
        const sql = fs.readFileSync(seedPath, 'utf8');

        console.log('Inserting realistic seed data...');
        // Note: For complex scripts with multiple statements, the pg driver 
        // usually handles them fine if passed as a single string.
        await query(sql);
        console.log('Database seeded successfully for Admin Dashboard testing!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedData();
