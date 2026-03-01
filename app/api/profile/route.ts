import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { getAIUsageStats } from '@/lib/ai';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT settings FROM user_profiles WHERE user_id = $1',
      [session.user.id]
    );

    const profile = result.rows[0] || { settings: {} };
    const aiUsage = await getAIUsageStats(session.user.id);

    return NextResponse.json({
      success: true,
      profile: {
        settings: (profile as { settings?: unknown }).settings,
        aiUsage,
      },
    });
  } catch (error) {
    logger.error('Fetch profile failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { action?: string; settings?: unknown };
    const { action, settings } = body;

    if (action === 'update-settings' && settings !== undefined) {
      const existingResult = await query(
        'SELECT user_id FROM user_profiles WHERE user_id = $1',
        [session.user.id]
      );

      if (existingResult.rows.length > 0) {
        await query(
          'UPDATE user_profiles SET settings = $1, updated_at = NOW() WHERE user_id = $2',
          [settings, session.user.id]
        );
      } else {
        await query(
          'INSERT INTO user_profiles (user_id, settings) VALUES ($1, $2)',
          [session.user.id, settings]
        );
      }

      return NextResponse.json({ success: true, message: 'Settings saved' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    logger.error('Update profile failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
