import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const totalResult = await query('SELECT COUNT(*) as total FROM applications');
        const statusResult = await query('SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC');
        const last7DaysResult = await query(`SELECT COUNT(*) as count FROM applications WHERE application_date >= NOW() - INTERVAL '7 days'`);
        const topCompaniesResult = await query(`SELECT company, COUNT(*) as count FROM applications GROUP BY company ORDER BY count DESC LIMIT 5`);

        return NextResponse.json({
            success: true,
            stats: {
                total: parseInt(totalResult.rows[0].total),
                byStatus: statusResult.rows,
                last7Days: parseInt(last7DaysResult.rows[0].count),
                topCompanies: topCompaniesResult.rows
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to get statistics' }, { status: 500 });
    }
}
