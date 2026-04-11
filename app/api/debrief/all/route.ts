import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const result = await query(
      `SELECT d.*, a.job_title, a.company
       FROM interview_debriefs d
       JOIN applications a ON a.id = d.application_id
       WHERE d.user_id = $1
       ORDER BY d.interview_date DESC NULLS LAST, d.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ success: true, debriefs: result.rows });
  } catch (error) {
    logger.error('All debriefs fetch failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to fetch debriefs' }, { status: 500 });
  }
}
