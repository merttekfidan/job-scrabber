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
        const status = searchParams.get('status');
        const company = searchParams.get('company');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const work_mode = searchParams.get('work_mode');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let sql = 'SELECT * FROM applications WHERE user_id = $1';
        const params = [userId];
        let paramIndex = 2;

        if (status) { sql += ` AND status = $${paramIndex++}`; params.push(status); }
        if (company) { sql += ` AND company = $${paramIndex++}`; params.push(company); }
        if (from) { sql += ` AND application_date >= $${paramIndex++}`; params.push(from); }
        if (to) { sql += ` AND application_date <= $${paramIndex++}`; params.push(to); }
        if (work_mode) { sql += ` AND work_mode = $${paramIndex++}`; params.push(work_mode); }

        sql += ` ORDER BY application_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return NextResponse.json({ success: true, count: result.rows.length, applications: result.rows });
    } catch (error) {
        console.error('Error filtering:', error);
        return NextResponse.json({ success: false, error: 'Failed to filter applications' }, { status: 500 });
    }
}
