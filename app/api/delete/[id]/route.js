import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        const { id } = params;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        const result = await query('DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete application' }, { status: 500 });
    }
}
