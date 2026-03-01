import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { SaveApplicationSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

const normalizeWorkMode = (mode: string | null | undefined): string => {
  if (!mode) return 'Unknown';
  const m = mode.toLowerCase();
  if (m.includes('remote')) return 'Remote';
  if (m.includes('hybrid')) return 'Hybrid';
  if (m.includes('on') && m.includes('site')) return 'Onsite';
  return 'Unknown';
};

export async function POST(request: Request) {
  try {
    let session = await auth();

    if (
      !session?.user?.id &&
      process.env.NODE_ENV !== 'production' &&
      request.headers.get('x-dev-extension') === 'true'
    ) {
      const devUser = await query('SELECT id, email, name FROM users WHERE email = $1', [
        'merttekfidan@gmail.com',
      ]);
      if (devUser.rows.length > 0) {
        session = {
          user: devUser.rows[0] as { id: string; email?: string | null; name?: string | null },
          expires: new Date().toISOString(),
        } as typeof session;
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(request, `save:${userId}`);
    const rlResult = standardLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

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
      metadata,
      originalContent,
      interviewStages,
      roleSummary,
      hiringManager,
      companyInfo,
    } = body;

    const validWorkMode = normalizeWorkMode(workMode);

    if (!jobTitle || !company || !jobUrl || !applicationDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

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
        jobTitle,
        company,
        location,
        validWorkMode,
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
        JSON.stringify(
          interviewPrepNotes?.redFlags || interviewPrepNotes?.potentialRedFlags || []
        ),
        (metadata as { jobBoardSource?: string })?.jobBoardSource || 'Unknown',
        originalContent || null,
        JSON.stringify(interviewStages || []),
        roleSummary || null,
        body.formattedContent || null,
        JSON.stringify(body.negativeSignals || []),
        userId,
        JSON.stringify(hiringManager || {}),
        JSON.stringify(companyInfo || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Application saved successfully',
      id: (result.rows[0] as { id: number }).id,
    });
  } catch (error) {
    logger.error('Save application failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save application',
      },
      { status: 500 }
    );
  }
}
