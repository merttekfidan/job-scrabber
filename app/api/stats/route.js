import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log('Stats API: Unauthorized');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        console.log(`Stats API: Fetching for user ${session.user.email} (ID: ${userId})`);

        const totalResult = await query('SELECT COUNT(*) as total FROM applications WHERE user_id = $1', [userId]);
        const statusResult = await query('SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status ORDER BY count DESC', [userId]);
        const last7DaysResult = await query(`SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '7 days'`, [userId]);
        const topCompaniesResult = await query(`SELECT company, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY company ORDER BY count DESC LIMIT 5`, [userId]);

        return NextResponse.json({
            success: true,
            stats: {
                total: parseInt(totalResult.rows[0].total),
                byStatus: statusResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                topCompanies: topCompaniesResult.rows
            },
            user: {
                email: session.user.email,
                name: session.user.name
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to get statistics' }, { status: 500 });
    }
}
