import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { StudyUpdateProgressSchema, validateBody } from '@/lib/validations';
import logger from '@/lib/logger';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const rawBody = await req.json();
    const validation = validateBody(StudyUpdateProgressSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const existing = await query(
      'SELECT id FROM study_packages WHERE id = $1 AND user_id = $2',
      [Number(id), userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const questionsPrepared = Array.from(new Set(validation.data.questionsPrepared));

    const result = await query(
      `UPDATE study_packages
       SET questions_prepared = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [JSON.stringify(questionsPrepared), Number(id), userId]
    );

    return NextResponse.json({ success: true, package: result.rows[0] });
  } catch (error) {
    logger.error('Study progress update failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update study progress' },
      { status: 500 }
    );
  }
}

