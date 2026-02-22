import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

/**
 * GET /api/check-application?url=<jobUrl>
 * 
 * Lightweight endpoint to check if an application already exists for this user + URL.
 * Called by the extension BEFORE the expensive AI processing step.
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const jobUrl = searchParams.get('url');

        if (!jobUrl) {
            return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
        }

        const result = await query(
            'SELECT id, job_title, company, application_date, notes, status FROM applications WHERE job_url = $1 AND user_id = $2',
            [jobUrl, session.user.id]
        );

        if (result.rows.length > 0) {
            const existing = result.rows[0];
            return NextResponse.json({
                success: true,
                exists: true,
                existingApplication: {
                    id: existing.id,
                    jobTitle: existing.job_title,
                    company: existing.company,
                    applicationDate: existing.application_date,
                    notes: existing.notes,
                    status: existing.status
                }
            });
        }

        return NextResponse.json({ success: true, exists: false });
    } catch (error) {
        console.error('Check application error:', error);
        return NextResponse.json({ success: false, error: 'Failed to check application' }, { status: 500 });
    }
}
