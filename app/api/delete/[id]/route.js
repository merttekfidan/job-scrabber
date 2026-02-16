import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        const result = await query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete application' }, { status: 500 });
    }
}
