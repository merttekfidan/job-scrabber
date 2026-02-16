import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT * FROM applications ORDER BY application_date DESC');
        return NextResponse.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Error listing applications:', error);
        return NextResponse.json({ success: false, error: 'Failed to list applications' }, { status: 500 });
    }
}
