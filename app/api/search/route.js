import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
        }

        const result = await query(
            `SELECT * FROM applications WHERE to_tsvector('english', COALESCE(job_title, '') || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(company_description, '')) @@ plainto_tsquery('english', $1) OR job_title ILIKE $2 OR company ILIKE $2 OR location ILIKE $2 ORDER BY application_date DESC`,
            [q, `%${q}%`]
        );
        return NextResponse.json({ success: true, query: q, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error searching:', error);
        return NextResponse.json({ success: false, error: 'Failed to search applications' }, { status: 500 });
    }
}
