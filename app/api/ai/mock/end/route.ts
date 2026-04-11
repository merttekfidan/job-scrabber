import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { MOCK_SESSION_DEBRIEF_PROMPT } from '@/lib/ai/prompts';
import { MockEndSessionSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import type { MockQA, MockSessionDebrief } from '@/types/mock';

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
    const validation = validateBody(MockEndSessionSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { sessionId } = validation.data;

    const sessionResult = await query(
      `SELECT ms.interview_plan, ms.questions_and_answers, ms.round_type, ms.started_at,
              a.formatted_content, a.original_content, a.company_description
       FROM mock_sessions ms
       JOIN applications a ON a.id = ms.application_id
       WHERE ms.id = $1 AND ms.user_id = $2`,
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const row = sessionResult.rows[0] as {
      interview_plan: Record<string, unknown>;
      questions_and_answers: MockQA[];
      round_type: string;
      started_at: string;
      formatted_content: string | null;
      original_content: string | null;
      company_description: string | null;
    };

    const qas: MockQA[] = Array.isArray(row.questions_and_answers) ? row.questions_and_answers : [];
    const jobDescription = row.formatted_content || row.original_content || row.company_description || '';

    const allQuestionsStr = qas.map((qa, i) => `Q${i + 1}: ${qa.question.question}`).join('\n');
    const allAnswersStr = qas.map((qa, i) => `A${i + 1}: ${qa.userAnswer}`).join('\n');
    const allEvaluationsStr = JSON.stringify(qas.map((qa) => qa.evaluation));

    const prompt = MOCK_SESSION_DEBRIEF_PROMPT(
      allQuestionsStr,
      allAnswersStr,
      allEvaluationsStr,
      row.round_type,
      jobDescription.substring(0, 4000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const debrief = parseAIResponse(aiResponse) as MockSessionDebrief;

    const startedAt = new Date(row.started_at);
    const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);

    await query(
      `UPDATE mock_sessions SET
        status = 'completed',
        debrief = $1,
        overall_score = $2,
        grade = $3,
        hiring_decision = $4,
        category_scores = $5,
        duration_seconds = $6,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        JSON.stringify(debrief),
        debrief.overallScore ?? null,
        debrief.grade ?? null,
        debrief.hiringDecision ?? null,
        JSON.stringify(debrief.categoryScores ?? {}),
        durationSeconds,
        sessionId,
      ]
    );

    return NextResponse.json({ success: true, debrief, sessionId });
  } catch (error) {
    logger.error('Mock end failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to generate debrief' }, { status: 500 });
  }
}
