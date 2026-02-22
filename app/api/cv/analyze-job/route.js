import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { CV_SWOT_ANALYSIS_PROMPT, PERSONALIZED_PREP_PROMPT } from '@/lib/prompts';
import { AnalyzeJobSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const rlKey = getRateLimitKey(req, `ai:${userId}`);
        const rlResult = aiLimiter(rlKey);
        if (!rlResult.success) {
            return NextResponse.json({ success: false, error: `AI rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
        }

        const rawBody = await req.json();
        const validation = validateBody(AnalyzeJobSchema, rawBody);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
        }

        const { applicationId } = validation.data;

        // 1. Fetch Job Application Details
        const appResult = await query('SELECT * FROM applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
        if (appResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        const application = appResult.rows[0];

        // 2. Fetch Active CV
        const cvResult = await query('SELECT * FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1', [userId]);
        if (cvResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'No active CV found. Please upload one first.' }, { status: 400 });
        }
        const cv = cvResult.rows[0];

        // 3. Prepare Prompt context
        const jobDescription = application.formatted_content || application.original_content || application.company_description;
        const cvContent = cv.raw_text;

        // 4. Call AI for SWOT Analysis
        const swotPrompt = CV_SWOT_ANALYSIS_PROMPT(jobDescription, cvContent);
        const swotResponse = await callGroqAPI(swotPrompt, 0.2, userId);
        const swotJson = parseAIResponse(swotResponse);

        // 5. Call AI for Personalized Prep
        // We pass the CV analysis summary if available, otherwise the raw text
        const cvSummary = cv.ai_analysis?.summary || cvContent.substring(0, 1000);
        const prepPrompt = PERSONALIZED_PREP_PROMPT(cvSummary, jobDescription);
        const prepResponse = await callGroqAPI(prepPrompt, 0.2, userId);
        const prepJson = parseAIResponse(prepResponse);

        // 6. Combine Results
        const personalizedAnalysis = {
            swot: swotJson,
            prep: prepJson,
            analyzedAt: new Date().toISOString(),
            cvFilename: cv.filename
        };

        // 7. Update Database
        await query(
            'UPDATE applications SET personalized_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(personalizedAnalysis), applicationId]
        );

        return NextResponse.json({
            success: true,
            analysis: personalizedAnalysis
        });

    } catch (error) {
        console.error('Personalized Analysis Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to generate personalized analysis'
        }, { status: 500 });
    }
}
