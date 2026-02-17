import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { CV_SWOT_ANALYSIS_PROMPT } from '@/lib/prompts';
import { query } from '@/lib/db';

export async function POST(req) {
    try {
        const { jobId, cvContent } = await req.json();

        if (!jobId || !cvContent) {
            return NextResponse.json({ error: 'Missing jobId or cvContent' }, { status: 400 });
        }

        // Fetch job details
        const result = await query('SELECT * FROM applications WHERE id = $1', [jobId]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        const job = result.rows[0];

        const jobDescription = job.formatted_content || job.original_content || job.role_summary ||
            `Job Title: ${job.job_title}\nCompany: ${job.company}\nKey Skills: ${job.required_skills?.join(', ')}`;

        // Generate SWOT Analysis Prompt
        const prompt = CV_SWOT_ANALYSIS_PROMPT(jobDescription, cvContent);

        // Call LLM
        const responseContent = await callLLM([{ role: 'user', content: prompt }]);

        // Parse JSON
        let analysis;
        try {
            const cleanJson = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            analysis = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse SWOT JSON:', e);
            return NextResponse.json({ error: 'Failed to parse analysis result', raw: responseContent }, { status: 500 });
        }

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('CV Analysis API Error:', error);
        return NextResponse.json({ error: 'Failed to analyze CV' }, { status: 500 });
    }
}
