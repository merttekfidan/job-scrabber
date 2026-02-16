const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ==========================================
// 1. Database Configuration
// ==========================================
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

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    // Don't exit process on transient errors, let common retry logic handle it or just log
});

// Helper to execute queries
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

// ==========================================
// 2. Server Configuration
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==========================================
// 3. API Routes
// ==========================================

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/save - Save a new job application
 */
app.post('/api/save', async (req, res) => {
    try {
        const { jobTitle, company, location, workMode, salary, applicationDate, jobUrl, companyUrl, status, keyResponsibilities, requiredSkills, preferredSkills, companyDescription, interviewPrepNotes, metadata } = req.body;

        if (!jobTitle || !company || !jobUrl || !applicationDate) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const duplicateCheck = await query('SELECT id FROM applications WHERE job_url = $1', [jobUrl]);

        if (duplicateCheck.rows.length > 0) {
            const result = await query(
                `UPDATE applications SET job_title = $1, company = $2, location = $3, work_mode = $4, salary = $5, application_date = $6, company_url = $7, status = $8, key_responsibilities = $9, required_skills = $10, preferred_skills = $11, company_description = $12, interview_prep_key_talking_points = $13, interview_prep_questions_to_ask = $14, interview_prep_potential_red_flags = $15, source = $16 WHERE job_url = $17 RETURNING id`,
                [jobTitle, company, location, workMode, salary, applicationDate, companyUrl, status || 'Applied', JSON.stringify(keyResponsibilities || []), JSON.stringify(requiredSkills || []), JSON.stringify(preferredSkills || []), companyDescription, JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []), JSON.stringify(interviewPrepNotes?.questionsToAsk || []), JSON.stringify(interviewPrepNotes?.potentialRedFlags || []), metadata?.jobBoardSource || 'Unknown', jobUrl]
            );
            return res.json({ success: true, message: 'Application updated', id: result.rows[0].id });
        }

        const result = await query(
            `INSERT INTO applications (job_title, company, location, work_mode, salary, application_date, job_url, company_url, status, key_responsibilities, required_skills, preferred_skills, company_description, interview_prep_key_talking_points, interview_prep_questions_to_ask, interview_prep_potential_red_flags, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
            [jobTitle, company, location, workMode, salary, applicationDate, jobUrl, companyUrl, status || 'Applied', JSON.stringify(keyResponsibilities || []), JSON.stringify(requiredSkills || []), JSON.stringify(preferredSkills || []), companyDescription, JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []), JSON.stringify(interviewPrepNotes?.questionsToAsk || []), JSON.stringify(interviewPrepNotes?.potentialRedFlags || []), metadata?.jobBoardSource || 'Unknown']
        );
        res.json({ success: true, message: 'Application saved successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error saving:', error);
        res.status(500).json({ success: false, error: 'Failed to save application' });
    }
});

/**
 * GET /api/list - List all applications
 */
app.get('/api/list', async (req, res) => {
    try {
        const result = await query('SELECT * FROM applications ORDER BY application_date DESC');
        res.json({ success: true, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error listing:', error);
        res.status(500).json({ success: false, error: 'Failed to list applications' });
    }
});

/**
 * GET /api/stats - Get basic statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const totalResult = await query('SELECT COUNT(*) as total FROM applications');
        const statusResult = await query('SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC');
        const last7DaysResult = await query(`SELECT COUNT(*) as count FROM applications WHERE application_date >= NOW() - INTERVAL '7 days'`);
        const topCompaniesResult = await query(`SELECT company, COUNT(*) as count FROM applications GROUP BY company ORDER BY count DESC LIMIT 5`);

        res.json({
            success: true,
            stats: {
                total: parseInt(totalResult.rows[0].total),
                byStatus: statusResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                topCompanies: topCompaniesResult.rows
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get statistics' });
    }
});

/**
 * GET /api/filter - Filter applications
 */
app.get('/api/filter', async (req, res) => {
    try {
        const { status, company, from, to, work_mode, limit = 50, offset = 0 } = req.query;
        let q = 'SELECT * FROM applications WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) { q += ` AND status = $${paramIndex++}`; params.push(status); }
        if (company) { q += ` AND company = $${paramIndex++}`; params.push(company); }
        if (from) { q += ` AND application_date >= $${paramIndex++}`; params.push(from); }
        if (to) { q += ` AND application_date <= $${paramIndex++}`; params.push(to); }
        if (work_mode) { q += ` AND work_mode = $${paramIndex++}`; params.push(work_mode); }

        q += ` ORDER BY application_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(q, params);
        res.json({ success: true, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error filtering:', error);
        res.status(500).json({ success: false, error: 'Failed to filter applications' });
    }
});

/**
 * GET /api/search - Search applications
 */
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, error: 'Search query is required' });

        const result = await query(
            `SELECT * FROM applications WHERE to_tsvector('english', COALESCE(job_title, '') || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(company_description, '')) @@ plainto_tsquery('english', $1) OR job_title ILIKE $2 OR company ILIKE $2 OR location ILIKE $2 ORDER BY application_date DESC`,
            [q, `%${q}%`]
        );
        res.json({ success: true, query: q, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ success: false, error: 'Failed to search applications' });
    }
});

/**
 * POST /api/update-status - Update status
 */
app.post('/api/update-status', async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ success: false, error: 'ID and status required' });

        const result = await query('UPDATE applications SET status = $1 WHERE id = $2 RETURNING id', [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Application not found' });

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

/**
 * DELETE /api/delete/:id - Delete application
 */
app.delete('/api/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Application not found' });
        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ success: false, error: 'Failed to delete application' });
    }
});

/**
 * GET /api/analytics - Get analytics
 */
app.get('/api/analytics', async (req, res) => {
    try {
        const totalResult = await query('SELECT COUNT(*) as total FROM applications');
        const byStatusResult = await query('SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC');
        const byWorkModeResult = await query('SELECT work_mode, COUNT(*) as count FROM applications WHERE work_mode IS NOT NULL GROUP BY work_mode ORDER BY count DESC');
        const byMonthResult = await query(`SELECT TO_CHAR(application_date, 'YYYY-MM') as month, COUNT(*) as count FROM applications WHERE application_date >= NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month DESC`);
        const topCompaniesResult = await query('SELECT company, COUNT(*) as count FROM applications GROUP BY company ORDER BY count DESC LIMIT 10');
        const last7DaysResult = await query(`SELECT COUNT(*) as count FROM applications WHERE application_date >= NOW() - INTERVAL '7 days'`);
        const avgPerWeekResult = await query(`SELECT COUNT(*)::float / GREATEST(EXTRACT(WEEK FROM (NOW() - MIN(application_date)))::float, 1) as avg_per_week FROM applications`);

        res.json({
            success: true,
            analytics: {
                total: parseInt(totalResult.rows[0].total),
                byStatus: byStatusResult.rows,
                byWorkMode: byWorkModeResult.rows,
                byMonth: byMonthResult.rows,
                topCompanies: topCompaniesResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                avgPerWeek: parseFloat(avgPerWeekResult.rows[0]?.avg_per_week || 0).toFixed(1)
            }
        });
    } catch (error) {
        console.error('Error analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
});

/**
 * GET /api/companies - Get companies
 */
app.get('/api/companies', async (req, res) => {
    try {
        const result = await query('SELECT DISTINCT company, COUNT(*) as count FROM applications GROUP BY company ORDER BY company ASC');
        res.json({ success: true, count: result.rows.length, companies: result.rows });
    } catch (error) {
        console.error('Error companies:', error);
        res.status(500).json({ success: false, error: 'Failed to get companies' });
    }
});

// ==========================================
// 4. Static Files & Catch-all
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint and catch-all for SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'API Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ==========================================
// 5. Startup & Migration
// ==========================================
async function startServer() {
    try {
        console.log('🚀 Starting server sequence...');

        // 1. Run Migration
        if (process.env.DATABASE_URL) {
            console.log('📦 Running database migrations...');
            const schemaPath = path.join(__dirname, 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await pool.query(schema);
                console.log('✅ Schema migration applied (IF NOT EXISTS).');
            } else {
                console.warn('⚠️  schema.sql not found, skipping migration.');
            }
        } else {
            console.log('⚠️  Skipping migration (No DATABASE_URL).');
        }

        // 2. Start Listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`
╔════════════════════════════════════════╗
║   Job Tracker API Server Running      ║
║   Port: ${PORT.toString().padEnd(31)}║
║   Address: 0.0.0.0                    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)}║
╚════════════════════════════════════════╝
            `);
        });

    } catch (error) {
        console.error('❌ Fatal Error during startup:', error);
        process.exit(1);
    }
}

startServer();
