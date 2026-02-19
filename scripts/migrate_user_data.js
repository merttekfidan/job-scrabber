
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateData() {
    try {
        const email = 'merttekfidan@gmail.com';

        // 1. Get User ID
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rowCount === 0) {
            console.error(`User ${email} not found!`);
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`Found User ID: ${userId}`);

        // 2. Update Applications
        const appRes = await pool.query(`
            UPDATE applications 
            SET user_id = $1 
            WHERE user_id IS NULL OR user_id != $1
        `, [userId]);
        console.log(`Updated ${appRes.rowCount} applications.`);

        // 3. Update CVs
        const cvRes = await pool.query(`
            UPDATE cv_data 
            SET user_id = $1 
            WHERE user_id IS NULL OR user_id != $1
        `, [userId]);
        console.log(`Updated ${cvRes.rowCount} CV entries.`);

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await pool.end();
    }
}

migrateData();
