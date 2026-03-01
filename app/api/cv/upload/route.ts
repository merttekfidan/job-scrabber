export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { CV_ANALYSIS_PROMPT } from '@/lib/ai/prompts';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import logger from '@/lib/logger';

if (typeof global !== 'undefined' && !(global as Record<string, unknown>).DOMMatrix) {
  (global as Record<string, unknown>).DOMMatrix = class {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let pdfData: { text?: string };
    try {
      pdfData = await pdf(buffer);
    } catch (parseError) {
      logger.error('PDF parse failed', { error: parseError instanceof Error ? parseError.message : String(parseError) });
      return NextResponse.json(
        { success: false, error: 'Failed to parse PDF file. Ensure it is a valid PDF.' },
        { status: 422 }
      );
    }

    if (!pdfData?.text) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF' },
        { status: 422 }
      );
    }

    const rawText = pdfData.text;

    const analysisPrompt = CV_ANALYSIS_PROMPT(rawText);
    const aiResponse = await callGroqAPI(analysisPrompt, 0.2, userId);
    const analysisJson = parseAIResponse(aiResponse);

    await query('UPDATE cv_data SET is_active = FALSE WHERE user_id = $1', [userId]);

    const result = await query(
      'INSERT INTO cv_data (filename, raw_text, ai_analysis, is_active, user_id) VALUES ($1, $2, $3, TRUE, $4) RETURNING *',
      [file.name, rawText, JSON.stringify(analysisJson), userId]
    );

    return NextResponse.json({
      success: true,
      message: 'CV uploaded and analyzed successfully',
      cv: result.rows[0],
    });
  } catch (error) {
    logger.error('CV upload failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process CV upload',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const result = await query(
      'SELECT * FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    return NextResponse.json({
      success: true,
      cv: result.rows[0] || null,
    });
  } catch (error) {
    logger.error('CV fetch failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch CV data' }, { status: 500 });
  }
}
