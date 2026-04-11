import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { scrapeCompanyWebsite } from '@/lib/scraper';
import { callClaudeJSON } from '@/lib/ai/claude';
import { COMPANY_RESEARCH_PROMPT } from '@/lib/ai/prompts';
import { validateBody, JobResearchSchema } from '@/lib/validations';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateBody(JobResearchSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { companyName, companyUrl, jobData } = validation.data;

    let companyWebContent = '';
    if (companyUrl) {
      companyWebContent = await scrapeCompanyWebsite(companyUrl);
      companyWebContent = companyWebContent.slice(0, 15000);
    }

    const companyData = await callClaudeJSON(
      COMPANY_RESEARCH_PROMPT(companyName, companyWebContent, JSON.stringify(jobData)),
      { userId: session.user.id, model: 'claude-sonnet-4-20250514' }
    );

    return NextResponse.json({ success: true, companyData });
  } catch (error) {
    logger.error('Company research failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to research company' },
      { status: 500 }
    );
  }
}
