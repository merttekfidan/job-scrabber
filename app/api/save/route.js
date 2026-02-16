import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            jobTitle, company, location, workMode, salary, applicationDate,
            jobUrl, companyUrl, status, keyResponsibilities, requiredSkills,
            preferredSkills, companyDescription, interviewPrepNotes, metadata
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

        // Check for duplicate
        const duplicateCheck = await query('SELECT id FROM applications WHERE job_url = $1', [jobUrl]);

        if (duplicateCheck.rows.length > 0) {
            // Update
            const result = await query(
                `UPDATE applications SET 
          job_title = $1, company = $2, location = $3, work_mode = $4, salary = $5, 
          application_date = $6, company_url = $7, status = $8, 
          key_responsibilities = $9, required_skills = $10, preferred_skills = $11, 
          company_description = $12, interview_prep_key_talking_points = $13, 
          interview_prep_questions_to_ask = $14, interview_prep_potential_red_flags = $15, 
          source = $16, updated_at = NOW()
        WHERE job_url = $17 RETURNING id`,
                [
                    jobTitle, company, location, validWorkMode, salary, applicationDate, companyUrl,
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
            return NextResponse.json({ success: true, message: 'Application updated', id: result.rows[0].id });
        }

        // Insert
        const result = await query(
            `INSERT INTO applications (
        job_title, company, location, work_mode, salary, application_date, 
        job_url, company_url, status, key_responsibilities, required_skills, 
        preferred_skills, company_description, interview_prep_key_talking_points, 
        interview_prep_questions_to_ask, interview_prep_potential_red_flags, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING id`,
            [
                jobTitle, company, location, workMode, salary, applicationDate,
                jobUrl, companyUrl, status || 'Applied',
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

        return NextResponse.json({ success: true, message: 'Application saved successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error saving application:', error);
        return NextResponse.json({ success: false, error: 'Failed to save application' }, { status: 500 });
    }
}
