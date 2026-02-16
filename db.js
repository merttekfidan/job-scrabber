const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
if (!process.env.DATABASE_URL) {
    console.warn('⚠️  WARNING: DATABASE_URL is not defined. Defaulting to localhost connection (this will fail in production/Railway).');
} else {
    console.log('✅ DATABASE_URL is defined. Connecting to provided database...');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

// Helper function to execute queries
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper function to get a client from the pool
async function getClient() {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the release method to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        return release();
    };

    return client;
}

module.exports = {
    query,
    getClient,
    pool
};
