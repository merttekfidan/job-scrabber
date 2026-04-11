import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { NEGOTIATION_ANALYZE_OFFER_PROMPT } from '@/lib/ai/prompts';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

const AnalyzeOfferSchema = z.object({
  applicationId: z.number().int().positive(),
});

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
    const validation = validateBody(AnalyzeOfferSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { applicationId } = validation.data;

    const offerResult = await query(
      'SELECT * FROM offer_details WHERE application_id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (offerResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No offer found for this application' }, { status: 404 });
    }
    const offer = offerResult.rows[0] as Record<string, unknown>;

    const appResult = await query(
      'SELECT job_title, company, formatted_content, original_content, company_description, company_info, salary FROM applications WHERE id = $1 AND user_id = $2',
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
    const companyInfo = typeof app.company_info === 'string' ? app.company_info : JSON.stringify(app.company_info ?? {});

    const prompt = NEGOTIATION_ANALYZE_OFFER_PROMPT(
      JSON.stringify(offer),
      jobDescription.substring(0, 5000),
      companyInfo.substring(0, 2000),
      cvContent.substring(0, 4000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const analysis = parseAIResponse(aiResponse) as Record<string, unknown>;

    await query(
      'UPDATE offer_details SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE application_id = $2 AND user_id = $3',
      [JSON.stringify(analysis), applicationId, userId]
    );

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    logger.error('Negotiation analyze failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to analyze offer' }, { status: 500 });
  }
}
