const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Also try loading from .env if .env.local doesn't exist or is empty
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not defined in environment variables.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    try {
        console.log('📦 Running database migrations...');
        const schemaPath = path.join(__dirname, '..', 'schema.sql');

        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            // Split by semicolon to run statements individually if needed, 
            // but for now relying on IF NOT EXISTS in schema.sql
            await pool.query(schema);
            console.log('✅ Schema migration applied successfully.');
        } else {
            console.error('❌ schema.sql not found at', schemaPath);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
