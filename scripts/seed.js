const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const sampleApps = [
    {
        jobTitle: 'Senior Frontend Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        status: 'Interview Scheduled',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        salary: '$160k - $200k',
        workMode: 'Hybrid',
        url: 'https://example.com/job1'
    },
    {
        jobTitle: 'Full Stack Developer',
        company: 'StartupUI',
        location: 'Remote',
        status: 'Applied',
        date: new Date(Date.now() - 5 * 86400000).toISOString(),
        salary: '$120k - $150k',
        workMode: 'Remote',
        url: 'https://example.com/job2'
    },
    {
        jobTitle: 'Product Engineer',
        company: 'Innovate Inc',
        location: 'New York, NY',
        status: 'Offer Received',
        date: new Date(Date.now() - 10 * 86400000).toISOString(),
        salary: '$180k',
        workMode: 'Onsite',
        url: 'https://example.com/job3'
    },
    {
        jobTitle: 'React Native Developer',
        company: 'MobileFirst',
        location: 'Remote',
        status: 'Rejected',
        date: new Date(Date.now() - 15 * 86400000).toISOString(),
        salary: '$130k - $160k',
        workMode: 'Remote',
        url: 'https://example.com/job4'
    },
    {
        jobTitle: 'Software Engineer II',
        company: 'BigTech',
        location: 'Seattle, WA',
        status: 'Applied',
        date: new Date().toISOString(),
        salary: '$150k - $190k',
        workMode: 'Hybrid',
        url: 'https://example.com/job5'
    },
    {
        jobTitle: 'Lead Developer',
        company: 'FinTech Sol',
        location: 'London, UK',
        status: 'Interview Scheduled',
        date: new Date(Date.now() - 1 * 86400000).toISOString(),
        salary: '£100k - £120k',
        workMode: 'Hybrid',
        url: 'https://example.com/job6'
    },
    {
        jobTitle: 'Backend Engineer',
        company: 'DataFlow',
        location: 'Austin, TX',
        status: 'Withdrawn',
        date: new Date(Date.now() - 20 * 86400000).toISOString(),
        salary: '$140k',
        workMode: 'Remote',
        url: 'https://example.com/job7'
    }
];

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        // Clear existing data (optional, but good for idempotent testing)
        // await pool.query('DELETE FROM applications');

        for (const app of sampleApps) {
            await pool.query(
                `INSERT INTO applications (
                    job_title, company, location, status, application_date, 
                    salary, work_mode, job_url, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Seed Script')
                ON CONFLICT (job_url) DO NOTHING`,
                [
                    app.jobTitle,
                    app.company,
                    app.location,
                    app.status,
                    app.date,
                    app.salary,
                    app.workMode,
                    app.url
                ]
            );
        }

        console.log(`✅ Successfully seeded ${sampleApps.length} applications!`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await pool.end();
    }
}

seed();
