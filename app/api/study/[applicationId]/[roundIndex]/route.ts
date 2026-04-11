import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string; roundIndex: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { applicationId, roundIndex } = await params;

    const appId = parseInt(applicationId, 10);
    const rIdx = parseInt(roundIndex, 10);
    if (isNaN(appId) || isNaN(rIdx)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM study_packages WHERE user_id = $1 AND application_id = $2 AND round_index = $3',
      [userId, appId, rIdx]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, package: null });
    }

    return NextResponse.json({ success: true, package: result.rows[0] });
  } catch (error) {
    logger.error('Study package fetch failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study package' },
      { status: 500 }
    );
  }
}

