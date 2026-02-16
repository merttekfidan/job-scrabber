const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/save
 * Save a new job application
 */
router.post('/save', async (req, res) => {
    try {
        const {
            jobTitle,
            company,
            location,
            workMode,
            salary,
            applicationDate,
            jobUrl,
            companyUrl,
            status,
            keyResponsibilities,
            requiredSkills,
            preferredSkills,
            companyDescription,
            interviewPrepNotes,
            metadata
        } = req.body;

        // Validate required fields
        if (!jobTitle || !company || !jobUrl || !applicationDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: jobTitle, company, jobUrl, applicationDate'
            });
        }

        // Check for duplicate by job URL
        const duplicateCheck = await db.query(
            'SELECT id FROM applications WHERE job_url = $1',
            [jobUrl]
        );

        if (duplicateCheck.rows.length > 0) {
            // Update existing application
            const result = await db.query(
                `UPDATE applications SET
                    job_title = $1,
                    company = $2,
                    location = $3,
                    work_mode = $4,
                    salary = $5,
                    application_date = $6,
                    company_url = $7,
                    status = $8,
                    key_responsibilities = $9,
                    required_skills = $10,
                    preferred_skills = $11,
                    company_description = $12,
                    interview_prep_key_talking_points = $13,
                    interview_prep_questions_to_ask = $14,
                    interview_prep_potential_red_flags = $15,
                    source = $16
                WHERE job_url = $17
                RETURNING id`,
                [
                    jobTitle,
                    company,
                    location,
                    workMode,
                    salary,
                    applicationDate,
                    companyUrl,
                    status || 'Applied',
                    JSON.stringify(keyResponsibilities || []),
                    JSON.stringify(requiredSkills || []),
                    JSON.stringify(preferredSkills || []),
                    companyDescription,
                    JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []),
                    JSON.stringify(interviewPrepNotes?.questionsToAsk || []),
                    JSON.stringify(interviewPrepNotes?.potentialRedFlags || []),
                    metadata?.jobBoardSource || 'Unknown',
                    jobUrl
                ]
            );

            return res.json({
                success: true,
                message: 'Application updated',
                id: result.rows[0].id
            });
        }

        // Insert new application
        const result = await db.query(
            `INSERT INTO applications (
                job_title, company, location, work_mode, salary,
                application_date, job_url, company_url, status,
                key_responsibilities, required_skills, preferred_skills,
                company_description,
                interview_prep_key_talking_points,
                interview_prep_questions_to_ask,
                interview_prep_potential_red_flags,
                source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id`,
            [
                jobTitle,
                company,
                location,
                workMode,
                salary,
                applicationDate,
                jobUrl,
                companyUrl,
                status || 'Applied',
                JSON.stringify(keyResponsibilities || []),
                JSON.stringify(requiredSkills || []),
                JSON.stringify(preferredSkills || []),
                companyDescription,
                JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []),
                JSON.stringify(interviewPrepNotes?.questionsToAsk || []),
                JSON.stringify(interviewPrepNotes?.potentialRedFlags || []),
                metadata?.jobBoardSource || 'Unknown'
            ]
        );

        res.json({
            success: true,
            message: 'Application saved successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error saving application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save application'
        });
    }
});

/**
 * GET /api/list
 * List all applications
 */
router.get('/list', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM applications ORDER BY application_date DESC'
        );

        res.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Error listing applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list applications'
        });
    }
});

/**
 * GET /api/stats
 * Get basic statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Total count
        const totalResult = await db.query('SELECT COUNT(*) as total FROM applications');
        const total = parseInt(totalResult.rows[0].total);

        // By status
        const statusResult = await db.query(
            'SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC'
        );

        // Last 7 days
        const last7DaysResult = await db.query(
            `SELECT COUNT(*) as count FROM applications 
             WHERE application_date >= NOW() - INTERVAL '7 days'`
        );

        // Top companies
        const topCompaniesResult = await db.query(
            `SELECT company, COUNT(*) as count FROM applications 
             GROUP BY company ORDER BY count DESC LIMIT 5`
        );

        res.json({
            success: true,
            stats: {
                total: total,
                byStatus: statusResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                topCompanies: topCompaniesResult.rows
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

module.exports = router;
