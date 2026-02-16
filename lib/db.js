import { Pool } from 'pg';

let pool;

if (!process.env.DATABASE_URL) {
    console.warn('⚠️  WARNING: DATABASE_URL is not defined.');
}

if (!pool) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    // Prevent crashing on idle client errors
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        // Don't exit process, just log. Connection might recover or new clients will be created.
    });
}

export async function query(text, params) {
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
