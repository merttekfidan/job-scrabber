import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { callClaudeJSON } from '@/lib/ai/claude';
import { ONBOARDING_QUESTIONS_PROMPT } from '@/lib/ai/prompts';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT cv_extracted FROM user_profiles WHERE user_id = $1',
      [session.user.id]
    );

    const profile = result.rows[0];
    if (!profile?.cv_extracted) {
      return NextResponse.json({ error: 'No CV data found. Please upload your CV first.' }, { status: 400 });
    }

    const questions = await callClaudeJSON(
      ONBOARDING_QUESTIONS_PROMPT(JSON.stringify(profile.cv_extracted)),
      { userId: session.user.id, model: 'claude-sonnet-4-20250514' }
    );

    return NextResponse.json({ success: true, ...(questions as Record<string, unknown>) });
  } catch (error) {
    logger.error('Generate questions failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
