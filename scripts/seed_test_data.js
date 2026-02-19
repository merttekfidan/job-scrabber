const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

async function seed() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not defined.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🌱 Seeding test data...');

        // 1. Ensure User exists (mocking NextAuth user)
        const email = 'test@example.com';
        let userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId;

        if (userResult.rows.length === 0) {
            console.log('Creating test user...');
            userResult = await pool.query(
                `INSERT INTO users (name, email, email_verified, image) 
                 VALUES ($1, $2, NOW(), $3) RETURNING id`,
                ['Test User', email, 'https://ui-avatars.com/api/?name=Test+User']
            );
        }
        userId = userResult.rows[0].id;
        console.log(`User ID: ${userId}`);

        // 2. Clear existing apps for this user to avoid duplicates/confusion
        await pool.query('DELETE FROM applications WHERE user_id = $1', [userId]);

        // 3. Create a test application with MISSING company description to test the Empty State fix
        const app = {
            jobTitle: 'Frontend Engineer',
            company: 'TechCorp Inc.',
            location: 'San Francisco, CA',
            workMode: 'Remote',
            salary: '$120k - $150k',
            status: 'Applied',
            jobUrl: 'https://example.com/job/123',
            companyUrl: 'https://example.com',
            companyDescription: null, // Crucial for testing the empty state fix
            date: new Date().toISOString()
        };

        await pool.query(
            `INSERT INTO applications (
                user_id, job_title, company, location, work_mode, salary, status, 
                job_url, company_url, company_description, application_date, 
                key_responsibilities, required_skills, preferred_skills, 
                interview_stages, interview_prep_key_talking_points, 
                interview_prep_questions_to_ask, interview_prep_potential_red_flags,
                negative_signals
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (job_url) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                company_description = EXCLUDED.company_description, -- Ensure it is NULL for testing
                status = EXCLUDED.status,
                updated_at = NOW()
            `,
            [
                userId, app.jobTitle, app.company, app.location, app.workMode, app.salary, app.status,
                app.jobUrl, app.companyUrl, app.companyDescription, app.date,
                '[]', '["React", "Node.js"]', '["TypeScript"]', '[]', '[]', '[]', '[]', '[]'
            ]
        );

        console.log('✅ Seeded test application successfully.');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
