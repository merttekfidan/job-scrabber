const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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

            console.log('Adding role_summary column...');
            await client.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS role_summary TEXT;
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
