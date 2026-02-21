import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { JOB_EXTRACTION_PROMPT } from '@/lib/prompts';
import { ExtensionProcessSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';

/**
 * Extension Process Endpoint
 * 
 * Receives raw page content from the Chrome extension,
 * processes it with AI server-side, and returns structured job data.
 * The extension no longer needs its own API key.
 */
export async function POST(req) {
    try {
        // Auth check — extension must be connected to a logged-in session
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please log in to the dashboard first.' },
                { status: 401 }
            );
        }

        // Rate limit
        const rateLimitKey = getRateLimitKey(req, `ext:${session.user.id}`);
        const rateLimitResult = aiLimiter(rateLimitKey);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, error: `Rate limited. Try again in ${rateLimitResult.reset}s.` },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const validation = validateBody(ExtensionProcessSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: validation.status }
            );
        }

        const { url, pageContent, jobBoard } = validation.data;

        // Call AI via server-side Groq API key
        const prompt = JOB_EXTRACTION_PROMPT(url, jobBoard, pageContent);
        const aiResponse = await callGroqAPI(prompt);
        const structuredData = parseAIResponse(aiResponse);

        // Map to the schema expected by /api/save
        const applicationData = {
            jobTitle: structuredData.jobTitle,
            company: structuredData.company,
            location: structuredData.location,
            workMode: structuredData.workMode,
            salary: structuredData.salary,
            jobUrl: url,
            applicationDate: new Date().toISOString(),
            status: 'Applied',
            requiredSkills: structuredData.requiredSkills || [],
            companyDescription: null,
            formattedContent: structuredData.formattedContent || null,
            negativeSignals: structuredData.negativeSignals || [],
            roleSummary: structuredData.interviewPrepNotes?.theProblemTheyAreSolving || null,
            interviewPrepNotes: {
                keyTalkingPoints: (structuredData.interviewPrepNotes?.keyTalkingPoints || []).map(tp => ({
                    point: tp.topic || tp.point,
                    explanation: tp.narrative || tp.explanation
                })),
                questionsToAsk: structuredData.interviewPrepNotes?.highImpactQuestions ||
                    structuredData.interviewPrepNotes?.questionsToAsk || [],
                potentialRedFlags: structuredData.negativeSignals ||
                    structuredData.interviewPrepNotes?.potentialRedFlags || [],
                techStackToStudy: structuredData.techStackToStudy || []
            },
            originalContent: pageContent.substring(0, 100000), // Cap at 100KB
        };

        return NextResponse.json({
            success: true,
            data: applicationData,
        });

    } catch (error) {
        console.error('Extension Process Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process job data' },
            { status: 500 }
        );
    }
}
