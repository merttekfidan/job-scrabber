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
      'SELECT * FROM applications WHERE user_id = $1 ORDER BY application_date DESC',
      [userId]
    );
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    logger.error('List applications failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to list applications' }, { status: 500 });
  }
}
