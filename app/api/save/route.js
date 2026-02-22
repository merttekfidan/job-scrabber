import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { SaveApplicationSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Rate limit
        const rlKey = getRateLimitKey(request, `save:${userId}`);
        const rlResult = standardLimiter(rlKey);
        if (!rlResult.success) {
            return NextResponse.json(
                { success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` },
                { status: 429 }
            );
        }

        // Validate input
        const rawBody = await request.json();
        const validation = validateBody(SaveApplicationSchema, rawBody);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: validation.status }
            );
        }

        const body = validation.data;
        const {
            jobTitle, company, location, workMode, salary, applicationDate,
            jobUrl, companyUrl, status, keyResponsibilities, requiredSkills,
            preferredSkills, companyDescription, interviewPrepNotes, metadata,
            originalContent, interviewStages, roleSummary, hiringManager, companyInfo
        } = body;

        // Normalize workMode to Title Case to match DB constraint
        const normalizeWorkMode = (mode) => {
            if (!mode) return 'Unknown';
            const m = mode.toLowerCase();
            if (m.includes('remote')) return 'Remote';
            if (m.includes('hybrid')) return 'Hybrid';
            if (m.includes('on') && m.includes('site')) return 'Onsite';
            return 'Unknown';
        };

        const validWorkMode = normalizeWorkMode(workMode);

        if (!jobTitle || !company || !jobUrl || !applicationDate) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicate for this user
        const duplicateCheck = await query(
            'SELECT id, application_date, status FROM applications WHERE job_url = $1 AND user_id = $2',
            [jobUrl, userId]
        );

        if (duplicateCheck.rows.length > 0) {
            const existing = duplicateCheck.rows[0];

            if (!body.forceReapply) {
                return NextResponse.json({
                    success: true,
                    duplicate: true,
                    existingApplication: {
                        id: existing.id,
                        applicationDate: existing.application_date,
                        status: existing.status
                    }
                });
            }

            // User confirmed reapply — merge update, preserving existing notes
            const reapplyNote = `\n---\n[Reapplied on ${new Date().toISOString().split('T')[0]}]`;

            // Try update with notes merge, fallback without notes if column doesn't exist
            let result;
            try {
                // First get existing notes
                const notesResult = await query('SELECT notes FROM applications WHERE id = $1', [existing.id]).catch(() => null);
                const existingNotes = notesResult?.rows?.[0]?.notes || '';
                const mergedNotes = existingNotes + reapplyNote;

                result = await query(
                    `UPDATE applications SET 
                  job_title = $1, company = $2, location = $3, work_mode = $4, salary = $5, 
                  application_date = $6, company_url = $7, status = $8, 
                  key_responsibilities = $9, required_skills = $10, preferred_skills = $11, 
                  company_description = $12, interview_prep_key_talking_points = $13, 
                  interview_prep_questions_to_ask = $14, interview_prep_potential_red_flags = $15, 
                  source = $16, original_content = $17, interview_stages = $18, role_summary = $19, 
                  formatted_content = $20, negative_signals = $21, 
                  hiring_manager = $22, company_info = $23, notes = $24, updated_at = NOW()
                WHERE job_url = $25 AND user_id = $26 RETURNING id`,
                    [
                        jobTitle, company, location, validWorkMode, salary, applicationDate, companyUrl,
                        status || 'Applied',
                        JSON.stringify(keyResponsibilities || []),
                        JSON.stringify(requiredSkills || []),
                        JSON.stringify(preferredSkills || []),
                        companyDescription,
                        JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []),
                        JSON.stringify(interviewPrepNotes?.questionsToAsk || []),
                        JSON.stringify(interviewPrepNotes?.redFlags || interviewPrepNotes?.potentialRedFlags || []),
                        metadata?.jobBoardSource || 'Unknown',
                        originalContent || null,
                        JSON.stringify(interviewStages || []),
                        roleSummary || null,
                        body.formattedContent || null,
                        JSON.stringify(body.negativeSignals || []),
                        JSON.stringify(hiringManager || {}),
                        JSON.stringify(companyInfo || {}),
                        mergedNotes,
                        jobUrl,
                        userId
                    ]
                );
            } catch (notesErr) {
                // Fallback: update WITHOUT notes column
                result = await query(
                    `UPDATE applications SET 
                  job_title = $1, company = $2, location = $3, work_mode = $4, salary = $5, 
                  application_date = $6, company_url = $7, status = $8, 
                  key_responsibilities = $9, required_skills = $10, preferred_skills = $11, 
                  company_description = $12, interview_prep_key_talking_points = $13, 
                  interview_prep_questions_to_ask = $14, interview_prep_potential_red_flags = $15, 
                  source = $16, original_content = $17, interview_stages = $18, role_summary = $19, 
                  formatted_content = $20, negative_signals = $21, 
                  hiring_manager = $22, company_info = $23, updated_at = NOW()
                WHERE job_url = $24 AND user_id = $25 RETURNING id`,
                    [
                        jobTitle, company, location, validWorkMode, salary, applicationDate, companyUrl,
                        status || 'Applied',
                        JSON.stringify(keyResponsibilities || []),
                        JSON.stringify(requiredSkills || []),
                        JSON.stringify(preferredSkills || []),
                        companyDescription,
                        JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []),
                        JSON.stringify(interviewPrepNotes?.questionsToAsk || []),
                        JSON.stringify(interviewPrepNotes?.redFlags || interviewPrepNotes?.potentialRedFlags || []),
                        metadata?.jobBoardSource || 'Unknown',
                        originalContent || null,
                        JSON.stringify(interviewStages || []),
                        roleSummary || null,
                        body.formattedContent || null,
                        JSON.stringify(body.negativeSignals || []),
                        JSON.stringify(hiringManager || {}),
                        JSON.stringify(companyInfo || {}),
                        jobUrl,
                        userId
                    ]
                );
            }
            return NextResponse.json({ success: true, message: 'Application reapplied & merged', id: result.rows[0].id });
        }

        // Insert
        const result = await query(
            `INSERT INTO applications (
        job_title, company, location, work_mode, salary, application_date, 
        job_url, company_url, status, key_responsibilities, required_skills, 
        preferred_skills, company_description, interview_prep_key_talking_points, 
        interview_prep_questions_to_ask, interview_prep_potential_red_flags, source,
        original_content, interview_stages, role_summary, formatted_content, negative_signals, user_id,
        hiring_manager, company_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) 
      RETURNING id`,
            [
                jobTitle, company, location, validWorkMode, salary, applicationDate,
                jobUrl, companyUrl, status || 'Applied',
                JSON.stringify(keyResponsibilities || []),
                JSON.stringify(requiredSkills || []),
                JSON.stringify(preferredSkills || []),
                companyDescription,
                JSON.stringify(interviewPrepNotes?.keyTalkingPoints || []),
                JSON.stringify(interviewPrepNotes?.questionsToAsk || []),
                JSON.stringify(interviewPrepNotes?.redFlags || interviewPrepNotes?.potentialRedFlags || []),
                metadata?.jobBoardSource || 'Unknown',
                originalContent || null,
                JSON.stringify(interviewStages || []),
                roleSummary || null,
                body.formattedContent || null,
                JSON.stringify(body.negativeSignals || []),
                userId,
                JSON.stringify(hiringManager || {}),
                JSON.stringify(companyInfo || {})
            ]
        );

        return NextResponse.json({ success: true, message: 'Application saved successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error saving application:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to save application' }, { status: 500 });
    }
}
