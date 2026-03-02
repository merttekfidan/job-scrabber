import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { UpdateDetailsSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(request, `update-details:${userId}`);
    const rlResult = standardLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const validation = validateBody(UpdateDetailsSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { id, updates } = validation.data;

    const allowed = [
      'status',
      'notes',
      'interview_stages',
      'salary',
      'work_mode',
      'location',
      'key_responsibilities',
      'required_skills',
      'original_content',
      'interview_prep_notes',
      'personalized_analysis',
    ];
    const jsonFields = [
      'interview_stages',
      'key_responsibilities',
      'required_skills',
      'interview_prep_notes',
      'personalized_analysis',
    ];

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key)) {
        if (jsonFields.includes(key)) {
          fields.push(`${key} = $${paramIndex}::jsonb`);
          values.push(typeof value === 'string' ? value : JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    values.push(userId);
    const sql = `UPDATE applications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      application: result.rows[0],
    });
  } catch (error) {
    logger.error('Update details failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update application',
      },
      { status: 500 }
    );
  }
}
