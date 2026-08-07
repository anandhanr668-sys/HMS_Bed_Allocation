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

async function upgradePrecision() {
    try {
        console.log('--- Upgrading Numeric Precisions in semen_analysis_reports ---');

        const numericCols = [
            'volume_ml',
            'ph',
            'sperm_concentration',
            'total_sperm_count',
            'progressive_motility_pct',
            'non_progressive_motility_pct',
            'immotile_pct',
            'vitality_pct',
            'normal_forms_pct',
            'head_abnormalities_pct',
            'midpiece_abnormalities_pct',
            'tail_abnormalities_pct'
        ];

        for (const col of numericCols) {
            console.log(`Upgrading ${col}...`);
            await pool.query(`ALTER TABLE semen_analysis_reports ALTER COLUMN ${col} TYPE DECIMAL(15,2)`);
            console.log(`✅ ${col} upgraded to DECIMAL(15,2)`);
        }

        console.log('✅ All numeric columns upgraded.');
    } catch (err) {
        console.error('❌ Upgrade failed:', err.message);
    } finally {
        await pool.end();
    }
}

upgradePrecision();
