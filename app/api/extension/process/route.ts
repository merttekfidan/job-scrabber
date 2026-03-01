import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { callAI } from '@/lib/ai';
import { parseAIResponse } from '@/lib/ai';
import { JOB_EXTRACTION_PROMPT } from '@/lib/ai/prompts';
import { ExtensionProcessSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

interface StructuredJobData {
  jobTitle?: string;
  company?: string;
  location?: string;
  workMode?: string;
  salary?: string;
  requiredSkills?: string[];
  companyDescription?: string;
  hiringManager?: Record<string, unknown>;
  companyInfo?: Record<string, unknown>;
  formattedContent?: string;
  negativeSignals?: string[] | unknown[];
  techStackToStudy?: string[];
  interviewPrepNotes?: {
    theProblemTheyAreSolving?: string;
    keyTalkingPoints?: Array<{ topic?: string; point?: string; narrative?: string; explanation?: string }>;
    likelyInterviewQuestions?: unknown[];
    questionsToAsk?: unknown[];
    highImpactQuestions?: unknown[];
    redFlags?: unknown[];
    potentialRedFlags?: unknown[];
  };
}

/**
 * Extension Process Endpoint
 * Receives raw page content from the Chrome extension,
 * processes it with AI server-side, and returns structured job data.
 */
export async function POST(req: Request) {
  try {
    let session = await auth();

    if (
      !session?.user?.id &&
      process.env.NODE_ENV !== 'production' &&
      req.headers.get('x-dev-extension') === 'true'
    ) {
      const devUser = await query('SELECT id, email, name FROM users WHERE email = $1', [
        'merttekfidan@gmail.com',
      ]);
      if (devUser.rows.length > 0) {
        session = {
          user: devUser.rows[0] as { id: string; email?: string | null; name?: string | null },
          expires: new Date().toISOString(),
        } as typeof session;
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in to the dashboard first.' },
        { status: 401 }
      );
    }

    const rateLimitKey = getRateLimitKey(req, `ext:${session.user.id}`);
    const rateLimitResult = aiLimiter(rateLimitKey);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${rateLimitResult.reset}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = validateBody(ExtensionProcessSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { url, pageContent, jobBoard } = validation.data;

    const prompt = JOB_EXTRACTION_PROMPT(url, jobBoard, pageContent);
    const aiResponse = await callAI(prompt, 0.2, session.user.id);
    const structuredData = parseAIResponse(aiResponse) as StructuredJobData;

    const interviewPrep = structuredData.interviewPrepNotes;
    const redFlagsRaw =
      interviewPrep?.redFlags ??
      (structuredData.negativeSignals || interviewPrep?.potentialRedFlags || []);

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
      companyDescription: structuredData.companyDescription || null,
      hiringManager: structuredData.hiringManager || {},
      companyInfo: structuredData.companyInfo || {},
      formattedContent: structuredData.formattedContent || null,
      negativeSignals: Array.isArray(structuredData.negativeSignals)
        ? structuredData.negativeSignals
        : [],
      roleSummary: interviewPrep?.theProblemTheyAreSolving || null,
      interviewPrepNotes: {
        keyTalkingPoints: (interviewPrep?.keyTalkingPoints || []).map(
          (tp: { topic?: string; point?: string; narrative?: string; explanation?: string }) => ({
            point: tp.topic ?? tp.point,
            explanation: tp.narrative ?? tp.explanation,
          })
        ),
        likelyInterviewQuestions: interviewPrep?.likelyInterviewQuestions || [],
        questionsToAsk:
          interviewPrep?.questionsToAsk || interviewPrep?.highImpactQuestions || [],
        redFlags: Array.isArray(redFlagsRaw)
          ? redFlagsRaw.map((f: unknown) =>
              typeof f === 'string' ? { flag: f, evidence: '', whatToAsk: '' } : f
            )
          : [],
        techStackToStudy: structuredData.techStackToStudy || [],
      },
      originalContent: pageContent.substring(0, 100000),
    };

    return NextResponse.json({
      success: true,
      data: applicationData,
    });
  } catch (error) {
    logger.error('Extension process failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process job data',
      },
      { status: 500 }
    );
  }
}
