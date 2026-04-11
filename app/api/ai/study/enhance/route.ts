import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { STUDY_ENHANCE_NOTES_PROMPT } from '@/lib/ai/prompts';
import { StudyEnhanceNotesSchema, validateBody } from '@/lib/validations';
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
      return NextResponse.json(
        { success: false, error: `AI rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(StudyEnhanceNotesSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { question, userNotes, applicationId } = validation.data;

    const appResult = await query(
      'SELECT formatted_content, original_content, company_description FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const app = appResult.rows[0] as {
      formatted_content: string | null;
      original_content: string | null;
      company_description: string | null;
    };

    const jobDescription =
      app.formatted_content ||
      app.original_content ||
      app.company_description ||
      '';

    const cvResult = await query(
      'SELECT raw_text FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    const cvRow = cvResult.rows[0] as { raw_text: string } | undefined;

    const prompt = STUDY_ENHANCE_NOTES_PROMPT(
      question,
      userNotes,
      jobDescription.substring(0, 10000),
      (cvRow?.raw_text ?? '').substring(0, 5000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.2, userId);
    const parsed = parseAIResponse(aiResponse) as Record<string, unknown>;

    return NextResponse.json({ success: true, enhanced: parsed });
  } catch (error) {
    logger.error('Study notes enhance failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to enhance study notes' },
      { status: 500 }
    );
  }
}

