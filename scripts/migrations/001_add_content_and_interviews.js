const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Also try loading from .env if .env.local doesn't exist or is empty
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not defined in .env or .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting migration: 001_add_content_and_interviews...');

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
        console.log('✅ Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
