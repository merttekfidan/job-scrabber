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
        console.log('🚀 Starting migration: 002_add_formatted_and_negative...');

        await client.query('BEGIN');

        // Add formatted_content column
        console.log('Adding formatted_content column...');
        await client.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS formatted_content TEXT;
        `);

        // Add negative_signals column
        console.log('Adding negative_signals column...');
        await client.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS negative_signals JSONB DEFAULT '[]';
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
