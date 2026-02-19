const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not defined.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('📦 Adding share_token column...');

        // 1. Add column if not exists
        await pool.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();
        `);

        // 2. Add Unique constraint
        // We do this separately to ensure it doesn't fail if column exists but constraint doesn't
        // But adding constraint to existing column with duplicates might fail. 
        // Since default is random uuid, duplicates are unlikely.

        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_share_token_key') THEN 
                    ALTER TABLE applications ADD CONSTRAINT applications_share_token_key UNIQUE (share_token); 
                END IF; 
            END $$;
        `);

        // 3. Ensure existing rows have it (if added without default previously, which isn't the case here but good practice)
        await pool.query(`
            UPDATE applications SET share_token = gen_random_uuid() WHERE share_token IS NULL;
        `);

        console.log('✅ share_token migration successful.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
