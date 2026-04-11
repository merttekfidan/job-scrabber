import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { validateBody, OnboardingAnswersSchema } from '@/lib/validations';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateBody(OnboardingAnswersSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await query(
      `UPDATE user_profiles
       SET onboarding_qa = $1,
           onboarding_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [JSON.stringify(validation.data.answers), session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Complete onboarding failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
