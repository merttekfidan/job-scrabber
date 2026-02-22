import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { UpdateDetailsSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const rlKey = getRateLimitKey(request, `update-details:${userId}`);
        const rlResult = standardLimiter(rlKey);
        if (!rlResult.success) {
            return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
        }

        const rawBody = await request.json();
        const validation = validateBody(UpdateDetailsSchema, rawBody);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
        }

        const { id, updates } = validation.data;

        // build dynamic query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            // whitelist allowed fields
            const allowed = [
                'status', 'notes', 'interview_stages', 'salary',
                'work_mode', 'location', 'key_responsibilities',
                'required_skills', 'preferred_skills', 'original_content',
                'interview_prep_notes'
            ];

            if (allowed.includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                // Handle JSON fields
                if (['interview_stages', 'key_responsibilities', 'required_skills', 'preferred_skills', 'interview_prep_notes'].includes(key)) {
                    values.push(typeof value === 'string' ? value : JSON.stringify(value));
                } else {
                    values.push(value);
                }
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
        }

        values.push(id);
        values.push(userId);
        const sql = `UPDATE applications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Updated successfully', application: result.rows[0] });

    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
    }
}
