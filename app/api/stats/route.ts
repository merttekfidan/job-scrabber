import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    let session = await auth();

    if (
      !session?.user?.id &&
      process.env.NODE_ENV !== 'production' &&
      req.headers.get('x-dev-extension') === 'true'
    ) {
      const devUser = await query('SELECT id, email, name FROM users WHERE email = $1', [
        'merttekfidan@gmail.com',
      ]);
      if (devUser.rows.length > 0) {
        session = {
          user: devUser.rows[0] as { id: string; email?: string | null; name?: string | null },
          expires: new Date().toISOString(),
        } as typeof session;
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM applications WHERE user_id = $1',
      [userId]
    );
    const statusResult = await query(
      'SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status ORDER BY count DESC',
      [userId]
    );
    const last7DaysResult = await query(
      `SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const topCompaniesResult = await query(
      `SELECT company, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY company ORDER BY count DESC LIMIT 5`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      stats: {
        total: parseInt((totalResult.rows[0] as { total: string }).total, 10),
        byStatus: statusResult.rows,
        last7Days: parseInt((last7DaysResult.rows[0] as { count: string }).count, 10),
        topCompanies: topCompaniesResult.rows,
      },
      user: {
        email: (session.user as { email?: string | null }).email,
        name: (session.user as { name?: string | null }).name,
      },
    });
  } catch (error) {
    logger.error('Stats failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to get statistics' }, { status: 500 });
  }
}
