import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
    console.log('Running migration 003: verification_codes table...');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_verification_codes_email 
            ON verification_codes(email, used, expires_at);
    `);

    console.log('✅ Migration 003 complete: verification_codes table created.');
    await pool.end();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
