import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { UpdateStatusSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const rlKey = getRateLimitKey(request, `update-status:${userId}`);
        const rlResult = standardLimiter(rlKey);
        if (!rlResult.success) {
            return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
        }

        const rawBody = await request.json();
        const validation = validateBody(UpdateStatusSchema, rawBody);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
        }

        const { id, status } = validation.data;

        const result = await query('UPDATE applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING id', [status, id, userId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
    }
}
