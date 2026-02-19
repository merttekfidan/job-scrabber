import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const totalResult = await query('SELECT COUNT(*) as total FROM applications WHERE user_id = $1', [userId]);
        const byStatusResult = await query('SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status ORDER BY count DESC', [userId]);
        const byWorkModeResult = await query('SELECT work_mode, COUNT(*) as count FROM applications WHERE user_id = $1 AND work_mode IS NOT NULL GROUP BY work_mode ORDER BY count DESC', [userId]);
        const byMonthResult = await query(`SELECT TO_CHAR(application_date, 'YYYY-MM') as month, COUNT(*) as count FROM applications WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month DESC`, [userId]);
        const topCompaniesResult = await query('SELECT company, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY company ORDER BY count DESC LIMIT 10', [userId]);
        const last7DaysResult = await query(`SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '7 days'`, [userId]);
        const avgPerWeekResult = await query(`SELECT COUNT(*)::float / GREATEST(EXTRACT(DAY FROM (NOW() - MIN(application_date)))::float / 7, 1) as avg_per_week FROM applications WHERE user_id = $1`, [userId]);

        return NextResponse.json({
            success: true,
            analytics: {
                total: parseInt(totalResult.rows[0].total),
                byStatus: byStatusResult.rows,
                byWorkMode: byWorkModeResult.rows,
                byMonth: byMonthResult.rows,
                topCompanies: topCompaniesResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                avgPerWeek: parseFloat(avgPerWeekResult.rows[0]?.avg_per_week || 0).toFixed(1)
            }
        });
    } catch (error) {
        console.error('Error analytics:', error);
        return NextResponse.json({ success: false, error: 'Failed to get analytics' }, { status: 500 });
    }
}
