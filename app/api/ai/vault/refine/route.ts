import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { VAULT_REFINE_ANSWER_PROMPT } from '@/lib/ai/prompts';
import { VaultRefineSchema, validateBody } from '@/lib/validations';
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
    const validation = validateBody(VaultRefineSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { question, userAnswer, applicationId } = validation.data;

    const cvResult = await query(
      'SELECT raw_text FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    const cvContent = cvResult.rows.length > 0
      ? (cvResult.rows[0] as { raw_text: string }).raw_text
      : 'No CV provided.';

    let jobDescription: string | undefined;
    if (applicationId) {
      const appResult = await query(
        'SELECT formatted_content, original_content, company_description FROM applications WHERE id = $1 AND user_id = $2',
        [applicationId, userId]
      );
      if (appResult.rows.length > 0) {
        const app = appResult.rows[0] as Record<string, string | null>;
        jobDescription = app.formatted_content || app.original_content || app.company_description || undefined;
      }
    }

    const prompt = VAULT_REFINE_ANSWER_PROMPT(
      question,
      userAnswer,
      cvContent.substring(0, 5000),
      jobDescription?.substring(0, 10000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.2, userId);
    const parsed = parseAIResponse(aiResponse) as Record<string, unknown>;

    return NextResponse.json({ success: true, refined: parsed });
  } catch (error) {
    logger.error('Vault refine failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to refine answer' },
      { status: 500 }
    );
  }
}
