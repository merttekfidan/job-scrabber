
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { COMPANY_INSIGHTS_PROMPT } from '@/lib/prompts';
import { CompanyInsightsSchema, validateBody } from '@/lib/validations';
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
        const validation = validateBody(CompanyInsightsSchema, rawBody);
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
        const cvContent = cvResult.rows.length > 0 ? cvResult.rows[0].raw_text : "No CV provided.";

        // 3. Build prompt using the centralized template
        const jobDescription = application.formatted_content || application.original_content || application.company_description;
        const prompt = COMPANY_INSIGHTS_PROMPT(application.company, jobDescription.substring(0, 15000), cvContent.substring(0, 5000));

        // 4. Call AI
        const aiResponse = await callGroqAPI(prompt, 0.2, userId);
        const insightsJson = parseAIResponse(aiResponse);

        // 5. Update Database
        // We will store this in a new field 'company_insights' or merge into 'personalized_analysis'.
        // Let's merge into 'personalized_analysis' under a 'companyInsights' key to keep schema clean.

        let currentAnalysis = application.personalized_analysis || {};
        // If it's a string, parse it
        if (typeof currentAnalysis === 'string') {
            try { currentAnalysis = JSON.parse(currentAnalysis); } catch (e) { currentAnalysis = {}; }
        }

        currentAnalysis.companyInsights = insightsJson;
        currentAnalysis.analyzedAt = new Date().toISOString();

        await query(
            'UPDATE applications SET personalized_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(currentAnalysis), applicationId]
        );

        return NextResponse.json({
            success: true,
            insights: insightsJson
        });

    } catch (error) {
        console.error('Company Insights Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to generate insights'
        }, { status: 500 });
    }
}
