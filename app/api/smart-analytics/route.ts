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

    const [
      velocityResult,
      responseRateResult,
      avgTimeResult,
      skillDemandResult,
      weeklyDigestResult,
      streakResult,
    ] = await Promise.all([
      query(
        `
        SELECT
            TO_CHAR(date_trunc('week', application_date), 'YYYY-MM-DD') as week_start,
            COUNT(*) as count
        FROM applications
        WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '4 weeks'
        GROUP BY week_start
        ORDER BY week_start
      `,
        [userId]
      ),
      query(
        `
        SELECT
            COUNT(*) FILTER (WHERE status != 'Applied') as responded,
            COUNT(*) as total
        FROM applications
        WHERE user_id = $1
      `,
        [userId]
      ),
      query(
        `
        SELECT
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(10,1) as avg_days
        FROM applications
        WHERE user_id = $1 AND status != 'Applied' AND updated_at IS NOT NULL AND created_at IS NOT NULL
      `,
        [userId]
      ),
      query(
        `SELECT required_skills FROM applications WHERE user_id = $1 AND required_skills IS NOT NULL`,
        [userId]
      ),
      query(
        `
        SELECT
            COUNT(*) FILTER (WHERE application_date >= date_trunc('week', CURRENT_DATE)) as this_week,
            COUNT(*) FILTER (WHERE application_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
                             AND application_date < date_trunc('week', CURRENT_DATE)) as last_week,
            COUNT(*) FILTER (WHERE status LIKE '%Interview%' AND application_date >= NOW() - INTERVAL '7 days') as interviews_this_week,
            COUNT(*) FILTER (WHERE status LIKE '%Offer%' AND application_date >= NOW() - INTERVAL '30 days') as offers_this_month
        FROM applications
        WHERE user_id = $1
      `,
        [userId]
      ),
      query(
        `
        SELECT application_date::date as d
        FROM applications
        WHERE user_id = $1 AND application_date IS NOT NULL
        GROUP BY d
        ORDER BY d DESC
        LIMIT 30
      `,
        [userId]
      ),
    ]);

    const skillCounts: Record<string, number> = {};
    for (const row of skillDemandResult.rows) {
      let skills = (row as { required_skills: unknown }).required_skills;
      if (typeof skills === 'string') {
        try {
          skills = JSON.parse(skills) as string[];
        } catch {
          skills = [];
        }
      }
      if (Array.isArray(skills)) {
        for (const skill of skills) {
          const key = String(skill).trim().toLowerCase();
          if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
        }
      }
    }
    const skillHeatmap = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    let streak = 0;
    if (streakResult.rows.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = today;

      for (const row of streakResult.rows) {
        const d = new Date((row as { d: string }).d);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((checkDate.getTime() - d.getTime()) / 86400000);
        if (diff <= 1) {
          streak++;
          checkDate = d;
        } else {
          break;
        }
      }
    }

    const weeklyApps = velocityResult.rows.map((r: { count: string }) =>
      parseInt(r.count, 10)
    );
    const avgWeekly =
      weeklyApps.length > 0 ? weeklyApps.reduce((a: number, b: number) => a + b, 0) / weeklyApps.length : 0;
    const digest = (weeklyDigestResult.rows[0] || {}) as Record<string, string | number>;
    const thisWeek = parseInt(String(digest.this_week ?? 0), 10);
    const velocityScore = avgWeekly > 0 ? Math.round((thisWeek / avgWeekly) * 100) : 0;

    const total = parseInt(String(responseRateResult.rows[0]?.total ?? 0), 10);
    const responded = parseInt(
      String((responseRateResult.rows[0] as { responded?: string })?.responded ?? 0),
      10
    );
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      smartAnalytics: {
        velocity: {
          score: velocityScore,
          thisWeek,
          avgPerWeek: parseFloat(avgWeekly.toFixed(1)),
          trend: velocityResult.rows,
        },
        responseRate: {
          percentage: responseRate,
          responded,
          total,
        },
        avgResponseDays: parseFloat(
          String((avgTimeResult.rows[0] as { avg_days?: string })?.avg_days ?? 0)
        ),
        skillHeatmap,
        weeklyDigest: {
          thisWeek: parseInt(String(digest.this_week ?? 0), 10),
          lastWeek: parseInt(String(digest.last_week ?? 0), 10),
          interviewsThisWeek: parseInt(String(digest.interviews_this_week ?? 0), 10),
          offersThisMonth: parseInt(String(digest.offers_this_month ?? 0), 10),
          change: parseInt(String(digest.this_week ?? 0), 10) - parseInt(String(digest.last_week ?? 0), 10),
        },
        streak,
      },
    });
  } catch (error) {
    logger.error('Smart analytics failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compute analytics',
      },
      { status: 500 }
    );
  }
}
