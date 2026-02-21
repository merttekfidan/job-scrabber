import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import {
    STAR_STORY_PROMPT,
    WHY_COMPANY_PROMPT,
    SALARY_NEGOTIATION_PROMPT,
    THIRTY_SIXTY_NINETY_PROMPT,
    COMPETENCY_PREDICTOR_PROMPT
} from '@/lib/hiring-prompts';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';

const FRAMEWORK_MAP = {
    star: (app, cv) => STAR_STORY_PROMPT(cv, app.formatted_content || app.original_content || ''),
    whyCompany: (app, cv) => WHY_COMPANY_PROMPT(app.company, app.formatted_content || app.original_content || '', cv),
    salary: (app, cv) => SALARY_NEGOTIATION_PROMPT(app.job_title, app.company, app.location || '', app.salary || '', app.formatted_content || app.original_content || ''),
    plan3060: (app, cv) => THIRTY_SIXTY_NINETY_PROMPT(app.job_title, app.company, app.formatted_content || app.original_content || '', cv),
    competency: (app, cv) => COMPETENCY_PREDICTOR_PROMPT(app.job_title, app.company, app.formatted_content || app.original_content || ''),
};

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const rlKey = getRateLimitKey(req, `hf:${userId}`);
        const rlResult = aiLimiter(rlKey);
        if (!rlResult.success) {
            return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
        }

        const body = await req.json();
        const { applicationId, framework } = body;

        if (!applicationId || !framework || !FRAMEWORK_MAP[framework]) {
            return NextResponse.json({ success: false, error: 'Invalid request. Provide applicationId and framework (star|whyCompany|salary|plan3060|competency).' }, { status: 400 });
        }

        // Fetch application
        const appResult = await query('SELECT * FROM applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
        if (appResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        const application = appResult.rows[0];

        // Fetch CV
        const cvResult = await query('SELECT * FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1', [userId]);
        const cvContent = cvResult.rows.length > 0 ? cvResult.rows[0].raw_text?.substring(0, 5000) : 'No CV provided.';

        // Generate prompt
        const prompt = FRAMEWORK_MAP[framework](application, cvContent);
        const aiResponse = await callGroqAPI(prompt, 0.3);
        const parsed = parseAIResponse(aiResponse);

        // Store in personalized_analysis under hiring_frameworks
        let currentAnalysis = application.personalized_analysis || {};
        if (typeof currentAnalysis === 'string') {
            try { currentAnalysis = JSON.parse(currentAnalysis); } catch (e) { currentAnalysis = {}; }
        }

        if (!currentAnalysis.hiringFrameworks) {
            currentAnalysis.hiringFrameworks = {};
        }
        currentAnalysis.hiringFrameworks[framework] = {
            data: parsed,
            generatedAt: new Date().toISOString()
        };

        await query(
            'UPDATE applications SET personalized_analysis = $1 WHERE id = $2 AND user_id = $3',
            [JSON.stringify(currentAnalysis), applicationId, userId]
        );

        return NextResponse.json({
            success: true,
            framework,
            data: parsed
        });
    } catch (error) {
        console.error('Hiring Framework Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to generate framework' }, { status: 500 });
    }
}
