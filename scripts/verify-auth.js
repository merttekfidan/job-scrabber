
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 Verifying Environment...');

const requiredVars = [
    'AUTH_SECRET',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
    'DATABASE_URL'
];

let hasError = false;

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Missing ${varName}`);
        hasError = true;
    } else {
        console.log(`✅ ${varName} is set`);
    }
});

if (process.env.AUTH_SECRET) {
    console.log(`ℹ️  AUTH_SECRET length: ${process.env.AUTH_SECRET.length}`);
}

async function checkDb() {
    console.log('\n🔍 Testing Database Connection...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        hasError = true;
    } finally {
        await pool.end();
    }

    if (hasError) {
        console.error('\n❌ Verification FAILED. Please fix the issues above.');
        process.exit(1);
    } else {
        console.log('\n✅ Verification PASSED. Configuration looks good.');
    }
}

checkDb();
