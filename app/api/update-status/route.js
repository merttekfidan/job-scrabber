import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
        }

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
