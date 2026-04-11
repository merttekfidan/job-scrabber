import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { applicationId } = await params;
    const appId = parseInt(applicationId, 10);

    if (isNaN(appId)) {
      return NextResponse.json({ success: false, error: 'Invalid applicationId' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM interview_debriefs WHERE application_id = $1 AND user_id = $2 ORDER BY round_index ASC',
      [appId, userId]
    );

    return NextResponse.json({ success: true, debriefs: result.rows });
  } catch (error) {
    logger.error('Debrief fetch failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to fetch debriefs' }, { status: 500 });
  }
}
