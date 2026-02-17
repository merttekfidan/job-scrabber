const { Pool } = require('pg');
const path = require('path');
// Load .env.local first
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Fallback to .env
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Connected to database...');

        try {
            await client.query('BEGIN');

            // Add original_content column
            console.log('Adding original_content column...');
            await client.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS original_content TEXT;
      `);

            // Add interview_stages column
            console.log('Adding interview_stages column...');
            await client.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS interview_stages JSONB DEFAULT '[]';
      `);

            await client.query('COMMIT');
            console.log('Migration successful!');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        pool.end();
    }
}

migrate();
