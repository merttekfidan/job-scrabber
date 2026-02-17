import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, updates } = body;

        if (!id || !updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ success: false, error: 'ID and updates required' }, { status: 400 });
        }

        // build dynamic query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            // whitelist allowed fields
            const allowed = [
                'status', 'notes', 'interview_stages', 'salary',
                'work_mode', 'location', 'key_responsibilities',
                'required_skills', 'preferred_skills', 'original_content'
            ];

            if (allowed.includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                // Handle JSON fields
                if (['interview_stages', 'key_responsibilities', 'required_skills', 'preferred_skills'].includes(key)) {
                    values.push(JSON.stringify(value));
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
        const sql = `UPDATE applications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

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
