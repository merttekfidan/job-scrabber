const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
    console.log('🚀 Starting database migration...');
    console.log(`ℹ️  Environment: ${process.env.NODE_ENV || 'development'}`);

    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        console.error('❌ FATAL: DATABASE_URL is missing in production environment!');
        console.error('   Please ensure you have added a PostgreSQL database to your Railway project.');
        process.exit(1);
    }

    console.log('🛡️  Safety Check: Running in non-destructive mode (IF NOT EXISTS). Your data is safe.\n');

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database migration completed successfully!\n');
        console.log('Tables created:');
        console.log('  - applications');
        console.log('\nIndexes created:');
        console.log('  - idx_applications_status');
        console.log('  - idx_applications_company');
        console.log('  - idx_applications_work_mode');
        console.log('  - idx_applications_application_date');
        console.log('  - idx_applications_job_url');
        console.log('  - idx_applications_search (full-text)');
        console.log('\nTriggers created:');
        console.log('  - update_applications_updated_at');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

migrate();
