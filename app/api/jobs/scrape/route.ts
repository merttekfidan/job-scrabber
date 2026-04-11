import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { callClaudeJSON } from '@/lib/ai/claude';
import { JOB_EXTRACTION_PROMPT } from '@/lib/ai/prompts';
import { validateBody, JobScrapeSchema } from '@/lib/validations';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateBody(JobScrapeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { url } = validation.data;

    const scrapedContent = await scrapeUrl(url);
    const truncated = scrapedContent.slice(0, 20000);

    const jobData = await callClaudeJSON(
      JOB_EXTRACTION_PROMPT(url, truncated),
      { userId: session.user.id, model: 'claude-sonnet-4-20250514' }
    );

    const jd = jobData as Record<string, unknown>;

    const result = await query(
      `INSERT INTO applications (
        user_id, job_title, company, location, work_mode, salary,
        job_url, source_url, status, job_data, application_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        session.user.id,
        (jd.jobTitle as string) || 'Unknown Position',
        (jd.company as string) || 'Unknown Company',
        (jd.location as string) || null,
        (jd.workMode as string) || null,
        (jd.salary as string) || null,
        url,
        url,
        'Applied',
        JSON.stringify(jobData),
      ]
    );

    return NextResponse.json({
      success: true,
      application: result.rows[0],
      jobData,
    });
  } catch (error) {
    logger.error('Job scrape failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape job' },
      { status: 500 }
    );
  }
}
