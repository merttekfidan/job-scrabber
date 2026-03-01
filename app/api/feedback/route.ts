import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const userEmail = session?.user?.email ?? 'Anonymous';

    const body = (await request.json()) as { feedback?: string; type?: string };
    const { feedback, type } = body;

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback is required' }, { status: 400 });
    }

    await query(
      'INSERT INTO feedbacks (user_id, email, type, content) VALUES ($1, $2, $3, $4)',
      [userId, userEmail, type || 'general', feedback]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Feedback failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}
