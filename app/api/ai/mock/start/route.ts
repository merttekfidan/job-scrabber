import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { MOCK_START_SESSION_PROMPT } from '@/lib/ai/prompts';
import { MockStartSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(req, `ai:${userId}`);
    const rlResult = aiLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
    }

    const rawBody = await req.json();
    const validation = validateBody(MockStartSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { applicationId, roundType, difficulty } = validation.data;

    const appResult = await query(
      'SELECT job_title, company, formatted_content, original_content, company_description, company_info, required_skills FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const app = appResult.rows[0] as Record<string, unknown>;

    const cvResult = await query(
      'SELECT raw_text FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    const cvContent = (cvResult.rows[0] as { raw_text: string } | undefined)?.raw_text ?? '';

    const jobDescription = (app.formatted_content as string) || (app.original_content as string) || (app.company_description as string) || '';
    let requiredSkills: string[] = [];
    try {
      const raw = app.required_skills;
      requiredSkills = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw as string[] : [];
    } catch { requiredSkills = []; }

    const companyInfo = typeof app.company_info === 'string' ? app.company_info : JSON.stringify(app.company_info ?? {});

    const prompt = MOCK_START_SESSION_PROMPT(
      jobDescription.substring(0, 6000),
      roundType,
      requiredSkills,
      companyInfo.substring(0, 2000),
      cvContent.substring(0, 4000),
      difficulty
    );

    const aiResponse = await callGroqAPI(prompt, 0.4, userId);
    const parsed = parseAIResponse(aiResponse) as { interviewPlan?: Record<string, unknown>; firstQuestion?: string };

    if (!parsed.interviewPlan) {
      return NextResponse.json({ success: false, error: 'AI did not return an interview plan' }, { status: 500 });
    }

    const plan = parsed.interviewPlan as { questions?: unknown[] };
    const totalQuestions = Array.isArray(plan.questions) ? plan.questions.length : 0;

    if (totalQuestions === 0) {
      return NextResponse.json({ success: false, error: 'AI returned an empty interview plan. Please try again.' }, { status: 500 });
    }

    const insertResult = await query(
      `INSERT INTO mock_sessions (user_id, application_id, round_type, difficulty, interview_plan, questions_and_answers, status, total_questions)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', $7) RETURNING id`,
      [userId, applicationId, roundType, difficulty, JSON.stringify(parsed.interviewPlan), JSON.stringify([]), totalQuestions]
    );

    const sessionId = (insertResult.rows[0] as { id: number }).id;

    return NextResponse.json({
      success: true,
      sessionId,
      firstQuestion: parsed.firstQuestion,
      totalQuestions,
      interviewPlan: parsed.interviewPlan,
    });
  } catch (error) {
    logger.error('Mock start failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to start mock session' }, { status: 500 });
  }
}
