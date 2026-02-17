import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { INTERVIEW_PREP_CHAT_PROMPT } from '@/lib/prompts';
import { query } from '@/lib/db';

export async function POST(req) {
    try {
        const { jobId, messages } = await req.json();

        if (!jobId || !messages) {
            return NextResponse.json({ error: 'Missing jobId or messages' }, { status: 400 });
        }

        // Fetch job context
        const result = await query('SELECT * FROM applications WHERE id = $1', [jobId]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        const job = result.rows[0];

        // Construct context object for prompt
        const context = {
            jobTitle: job.job_title,
            company: job.company,
            requiredSkills: Array.isArray(job.required_skills) ? job.required_skills : [],
            roleSummary: job.role_summary || job.formatted_content || job.original_content || 'No description available.'
        };

        // Construct system usage
        const systemPrompt = INTERVIEW_PREP_CHAT_PROMPT(context);

        // Prepare full conversation for LLM
        const llmMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const responseContent = await callLLM(llmMessages);

        return NextResponse.json({
            role: 'assistant',
            content: responseContent
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
}
