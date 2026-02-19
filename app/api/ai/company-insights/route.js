
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { applicationId } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
        }

        // 1. Fetch Job Application Details
        const appResult = await query('SELECT * FROM applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
        if (appResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        const application = appResult.rows[0];

        // 2. Fetch Active CV
        const cvResult = await query('SELECT * FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1', [userId]);
        const cvContent = cvResult.rows.length > 0 ? cvResult.rows[0].raw_text : "No CV provided.";

        // 3. Prepare Prompt
        const jobDescription = application.formatted_content || application.original_content || application.company_description;

        const prompt = `
        You are a Career Strategist. Analyze this company and job position to provide deep strategic insights for the candidate.

        JOB CONTEXT:
        Company: ${application.company}
        Description: ${jobDescription.substring(0, 15000)}

        CANDIDATE CV SUMMARY:
        ${cvContent.substring(0, 5000)}

        Generate a JSON response with the following structure:
        {
            "strategicFocus": "What is the company's current main focus, challenges, or market position? (Max 2-3 sentences)",
            "cultureFit": "Based on the description, what values/culture do they prioritize? (Max 3 keywords + 1 sentence explanation)",
            "whyUsAnswer": "A compelling, 3-sentence answer for 'Why do you want to work here?' that connects the company's mission with the candidate's background.",
            "whyYouAnswer": "A compelling, 3-sentence answer for 'Why should we hire you?' highlighting the strongest match."
        }
        `;

        // 4. Call AI
        const aiResponse = await callGroqAPI(prompt);
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
