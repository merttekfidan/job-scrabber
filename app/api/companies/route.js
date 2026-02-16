import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT DISTINCT company, COUNT(*) as count FROM applications GROUP BY company ORDER BY company ASC');
        return NextResponse.json({ success: true, count: result.rows.length, companies: result.rows });
    } catch (error) {
        console.error('Error companies:', error);
        return NextResponse.json({ success: false, error: 'Failed to get companies' }, { status: 500 });
    }
}
