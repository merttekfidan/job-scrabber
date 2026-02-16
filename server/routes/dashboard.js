const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/filter
 * Filter applications by status, company, date range, work mode
 */
router.get('/filter', async (req, res) => {
    try {
        const { status, company, from, to, work_mode, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM applications WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (company) {
            query += ` AND company = $${paramIndex}`;
            params.push(company);
            paramIndex++;
        }

        if (from) {
            query += ` AND application_date >= $${paramIndex}`;
            params.push(from);
            paramIndex++;
        }

        if (to) {
            query += ` AND application_date <= $${paramIndex}`;
            params.push(to);
            paramIndex++;
        }

        if (work_mode) {
            query += ` AND work_mode = $${paramIndex}`;
            params.push(work_mode);
            paramIndex++;
        }

        query += ' ORDER BY application_date DESC';
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Error filtering applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter applications'
        });
    }
});

/**
 * GET /api/search
 * Search applications by keyword
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        // Use PostgreSQL full-text search
        const result = await db.query(
            `SELECT * FROM applications
             WHERE to_tsvector('english', 
                 COALESCE(job_title, '') || ' ' || 
                 COALESCE(company, '') || ' ' || 
                 COALESCE(location, '') || ' ' ||
                 COALESCE(company_description, '')
             ) @@ plainto_tsquery('english', $1)
             OR job_title ILIKE $2
             OR company ILIKE $2
             OR location ILIKE $2
             ORDER BY application_date DESC`,
            [q, `%${q}%`]
        );

        res.json({
            success: true,
            query: q,
            count: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Error searching applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search applications'
        });
    }
});

/**
 * POST /api/update-status
 * Update application status
 */
router.post('/update-status', async (req, res) => {
    try {
        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                error: 'ID and status are required'
            });
        }

        const result = await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update status'
        });
    }
});

/**
 * DELETE /api/delete/:id
 * Delete an application
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM applications WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete application'
        });
    }
});

/**
 * GET /api/analytics
 * Get detailed analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        // Total applications
        const totalResult = await db.query('SELECT COUNT(*) as total FROM applications');
        const total = parseInt(totalResult.rows[0].total);

        // By status
        const byStatusResult = await db.query(
            'SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC'
        );

        // By work mode
        const byWorkModeResult = await db.query(
            `SELECT work_mode, COUNT(*) as count FROM applications 
             WHERE work_mode IS NOT NULL GROUP BY work_mode ORDER BY count DESC`
        );

        // Applications per month (last 6 months)
        const byMonthResult = await db.query(
            `SELECT TO_CHAR(application_date, 'YYYY-MM') as month, COUNT(*) as count
             FROM applications
             WHERE application_date >= NOW() - INTERVAL '6 months'
             GROUP BY month
             ORDER BY month DESC`
        );

        // Top companies
        const topCompaniesResult = await db.query(
            `SELECT company, COUNT(*) as count FROM applications 
             GROUP BY company ORDER BY count DESC LIMIT 10`
        );

        // Recent activity (last 7 days)
        const last7DaysResult = await db.query(
            `SELECT COUNT(*) as count FROM applications 
             WHERE application_date >= NOW() - INTERVAL '7 days'`
        );

        // Average applications per week
        const avgPerWeekResult = await db.query(
            `SELECT COUNT(*)::float / GREATEST(
                EXTRACT(WEEK FROM (NOW() - MIN(application_date)))::float, 1
             ) as avg_per_week
             FROM applications`
        );

        res.json({
            success: true,
            analytics: {
                total,
                byStatus: byStatusResult.rows,
                byWorkMode: byWorkModeResult.rows,
                byMonth: byMonthResult.rows,
                topCompanies: topCompaniesResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                avgPerWeek: parseFloat(avgPerWeekResult.rows[0]?.avg_per_week || 0).toFixed(1)
            }
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics'
        });
    }
});

/**
 * GET /api/recent
 * Get recent applications
 */
router.get('/recent', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await db.query(
            'SELECT * FROM applications ORDER BY application_date DESC LIMIT $1',
            [parseInt(limit)]
        );

        res.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Error getting recent applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recent applications'
        });
    }
});

/**
 * GET /api/companies
 * Get list of all companies
 */
router.get('/companies', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT DISTINCT company, COUNT(*) as count 
             FROM applications 
             GROUP BY company 
             ORDER BY company ASC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            companies: result.rows
        });
    } catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get companies'
        });
    }
});

module.exports = router;
