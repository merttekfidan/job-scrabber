
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function inspectData() {
    try {
        console.log("--- Users ---");
        const users = await pool.query('SELECT id, email FROM users');
        users.rows.forEach(u => console.log(`${u.email} (${u.id})`));

        console.log("\n--- Applications Count per User ---");
        const appCounts = await pool.query(`
            SELECT user_id, COUNT(*) 
            FROM applications 
            GROUP BY user_id
        `);
        appCounts.rows.forEach(row => {
            console.log(`User ID: ${row.user_id}, Count: ${row.count}`);
        });

        console.log("\n--- Applications with NULL user_id ---");
        const nullApps = await pool.query('SELECT COUNT(*) FROM applications WHERE user_id IS NULL');
        console.log(`Count: ${nullApps.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspectData();
