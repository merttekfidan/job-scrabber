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

        const result = await query('SELECT DISTINCT company, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY company ORDER BY company ASC', [userId]);
        return NextResponse.json({ success: true, count: result.rows.length, companies: result.rows });
    } catch (error) {
        console.error('Error companies:', error);
        return NextResponse.json({ success: false, error: 'Failed to get companies' }, { status: 500 });
    }
}
