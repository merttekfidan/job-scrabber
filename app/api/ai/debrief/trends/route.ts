import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { DEBRIEF_TREND_PROMPT } from '@/lib/ai/prompts';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import type { DebriefTrendReport } from '@/types/debrief';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Require at least 3 debriefs
    const countResult = await query(
      'SELECT COUNT(*) as cnt FROM interview_debriefs WHERE user_id = $1',
      [userId]
    );
    const count = parseInt((countResult.rows[0] as { cnt: string }).cnt, 10);
    if (count < 3) {
      return NextResponse.json(
        { success: false, error: 'At least 3 debriefs required for trend analysis', count },
        { status: 400 }
      );
    }

    const rlKey = getRateLimitKey(req, `ai:${userId}`);
    const rlResult = aiLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `AI rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const debriefResult = await query(
      `SELECT d.questions, d.overall_feeling, d.outcome, d.round_type,
              d.interview_date, d.interviewer_vibe, a.job_title, a.company
       FROM interview_debriefs d
       JOIN applications a ON a.id = d.application_id
       WHERE d.user_id = $1
       ORDER BY d.interview_date DESC NULLS LAST`,
      [userId]
    );

    const cvResult = await query(
      'SELECT raw_text FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    const cvText = (cvResult.rows[0] as { raw_text: string } | undefined)?.raw_text ?? '';

    const allOutcomes = debriefResult.rows
      .map((r: { outcome: string | null; job_title: string; company: string }) =>
        `${r.company} — ${r.job_title}: ${r.outcome ?? 'Pending'}`
      )
      .join('\n');

    const prompt = DEBRIEF_TREND_PROMPT(
      JSON.stringify(debriefResult.rows).substring(0, 12000),
      allOutcomes,
      cvText.substring(0, 4000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const parsed = parseAIResponse(aiResponse) as { trendReport?: DebriefTrendReport };

    if (!parsed.trendReport) {
      return NextResponse.json(
        { success: false, error: 'AI did not return a trend report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, trendReport: parsed.trendReport, count });
  } catch (error) {
    logger.error('Debrief trends failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to generate trend report' }, { status: 500 });
  }
}
