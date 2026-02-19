import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
        }

        const result = await query(
            `SELECT * FROM applications WHERE user_id = $1 AND (to_tsvector('english', COALESCE(job_title, '') || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(company_description, '')) @@ plainto_tsquery('english', $2) OR job_title ILIKE $3 OR company ILIKE $3 OR location ILIKE $3) ORDER BY application_date DESC`,
            [userId, q, `%${q}%`]
        );
        return NextResponse.json({ success: true, query: q, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error searching:', error);
        return NextResponse.json({ success: false, error: 'Failed to search applications' }, { status: 500 });
    }
}
