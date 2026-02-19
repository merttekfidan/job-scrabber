
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkSchema() {
    try {
        const tables = ['users', 'applications', 'cvs'];
        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
                ORDER BY ordinal_position;
            `);
            console.log(`\nColumns in '${table}' table:`);
            res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
        }
    } catch (err) {
        console.error("Error querying schema:", err);
    } finally {
        await pool.end();
    }
}

checkSchema();
