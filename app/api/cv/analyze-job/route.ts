import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { CV_SWOT_ANALYSIS_PROMPT, PERSONALIZED_PREP_PROMPT } from '@/lib/ai/prompts';
import { AnalyzeJobSchema, validateBody } from '@/lib/validations';
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
    const validation = validateBody(AnalyzeJobSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { applicationId } = validation.data;

    const appResult = await query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const application = appResult.rows[0] as Record<string, unknown>;

    const cvResult = await query(
      'SELECT * FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    if (cvResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active CV found. Please upload one first.' },
        { status: 400 }
      );
    }
    const cv = cvResult.rows[0] as { raw_text?: string; ai_analysis?: { summary?: string }; filename?: string };

    const jobDescription =
      (application.formatted_content as string) ||
      (application.original_content as string) ||
      (application.company_description as string);
    const cvContent = cv.raw_text ?? '';

    const swotPrompt = CV_SWOT_ANALYSIS_PROMPT(String(jobDescription), cvContent);
    const swotResponse = await callGroqAPI(swotPrompt, 0.2, userId);
    const swotJson = parseAIResponse(swotResponse);

    const cvSummary =
      (cv.ai_analysis as { summary?: string } | undefined)?.summary ?? cvContent.substring(0, 1000);
    const prepPrompt = PERSONALIZED_PREP_PROMPT(cvSummary, String(jobDescription));
    const prepResponse = await callGroqAPI(prepPrompt, 0.2, userId);
    const prepJson = parseAIResponse(prepResponse);

    const personalizedAnalysis = {
      swot: swotJson,
      prep: prepJson,
      analyzedAt: new Date().toISOString(),
      cvFilename: cv.filename,
    };

    await query(
      'UPDATE applications SET personalized_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(personalizedAnalysis), applicationId]
    );

    return NextResponse.json({
      success: true,
      analysis: personalizedAnalysis,
    });
  } catch (error) {
    logger.error('Personalized analysis failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate personalized analysis',
      },
      { status: 500 }
    );
  }
}
