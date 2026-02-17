import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { CV_SWOT_ANALYSIS_PROMPT, PERSONALIZED_PREP_PROMPT } from '@/lib/prompts';

export async function POST(req) {
    try {
        const { applicationId } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
        }

        // 1. Fetch Job Application Details
        const appResult = await query('SELECT * FROM applications WHERE id = $1', [applicationId]);
        if (appResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        const application = appResult.rows[0];

        // 2. Fetch Active CV
        const cvResult = await query('SELECT * FROM cv_data WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1');
        if (cvResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'No active CV found. Please upload one first.' }, { status: 400 });
        }
        const cv = cvResult.rows[0];

        // 3. Prepare Prompt context
        const jobDescription = application.formatted_content || application.original_content || application.company_description;
        const cvContent = cv.raw_text;

        // 4. Call AI for SWOT Analysis
        const swotPrompt = CV_SWOT_ANALYSIS_PROMPT(jobDescription, cvContent);
        const swotResponse = await callGroqAPI(swotPrompt);
        const swotJson = parseAIResponse(swotResponse);

        // 5. Call AI for Personalized Prep
        // We pass the CV analysis summary if available, otherwise the raw text
        const cvSummary = cv.ai_analysis?.summary || cvContent.substring(0, 1000);
        const prepPrompt = PERSONALIZED_PREP_PROMPT(cvSummary, jobDescription);
        const prepResponse = await callGroqAPI(prepPrompt);
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
