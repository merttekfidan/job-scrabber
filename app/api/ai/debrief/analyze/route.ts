import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { DEBRIEF_ANALYZE_PROMPT } from '@/lib/ai/prompts';
import { DebriefAnalyzeSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import type { InterviewDebrief, DebriefAnalysis } from '@/types/debrief';

type RawDebrief = InterviewDebrief & { formatted_content?: string; original_content?: string };

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
      return NextResponse.json(
        { success: false, error: `AI rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(DebriefAnalyzeSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { debriefId } = validation.data;

    // Fetch the debrief + application data in one query
    const debriefResult = await query(
      `SELECT d.*, a.formatted_content, a.original_content
       FROM interview_debriefs d
       JOIN applications a ON a.id = d.application_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [debriefId, userId]
    );
    if (debriefResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Debrief not found' }, { status: 404 });
    }
    const debrief = debriefResult.rows[0] as RawDebrief;

    // Fetch historical debriefs (excluding current)
    const histResult = await query(
      `SELECT questions, overall_feeling, outcome, round_type, interview_date
       FROM interview_debriefs
       WHERE user_id = $1 AND id != $2
       ORDER BY interview_date DESC NULLS LAST
       LIMIT 5`,
      [userId, debriefId]
    );

    const jobDescription =
      (debrief.formatted_content ?? debrief.original_content ?? '').substring(0, 8000);

    const debriefSummary = JSON.stringify({
      roundType: debrief.round_type,
      overallFeeling: debrief.overall_feeling,
      interviewerVibe: debrief.interviewer_vibe,
      generalNotes: debrief.general_notes,
      questions: debrief.questions,
    });

    const historicalSummary =
      histResult.rows.length > 0
        ? JSON.stringify(histResult.rows)
        : undefined;

    const prompt = DEBRIEF_ANALYZE_PROMPT(
      debriefSummary,
      jobDescription,
      debrief.round_type,
      historicalSummary
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const parsed = parseAIResponse(aiResponse) as { debriefAnalysis?: DebriefAnalysis };

    if (!parsed.debriefAnalysis) {
      return NextResponse.json(
        { success: false, error: 'AI did not return a debrief analysis' },
        { status: 500 }
      );
    }

    // Persist analysis back to the debrief row
    const updateResult = await query(
      `UPDATE interview_debriefs
       SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [JSON.stringify(parsed.debriefAnalysis), debriefId, userId]
    );

    return NextResponse.json({
      success: true,
      debrief: updateResult.rows[0],
      analysis: parsed.debriefAnalysis,
    });
  } catch (error) {
    logger.error('Debrief analyze failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to analyze debrief' }, { status: 500 });
  }
}
