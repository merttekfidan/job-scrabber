import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { callClaudeJSON } from '@/lib/ai/claude';
import { CV_EXTRACTION_PROMPT } from '@/lib/ai/prompts';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let rawText: string;
    if (file.name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text;
    } else {
      rawText = buffer.toString('utf-8');
    }

    if (rawText.length < 50) {
      return NextResponse.json({ error: 'CV content too short or unreadable' }, { status: 400 });
    }

    const truncated = rawText.slice(0, 15000);

    const extracted = await callClaudeJSON(
      CV_EXTRACTION_PROMPT(truncated),
      { userId: session.user.id, model: 'claude-sonnet-4-20250514' }
    );

    await query(
      `INSERT INTO user_profiles (user_id, cv_raw_text, cv_extracted, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         cv_raw_text = EXCLUDED.cv_raw_text,
         cv_extracted = EXCLUDED.cv_extracted,
         updated_at = CURRENT_TIMESTAMP`,
      [session.user.id, truncated, JSON.stringify(extracted)]
    );

    return NextResponse.json({ success: true, extracted });
  } catch (error) {
    logger.error('CV upload failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CV' },
      { status: 500 }
    );
  }
}
