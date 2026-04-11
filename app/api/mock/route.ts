import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    let result;
    if (applicationId) {
      result = await query(
        `SELECT id, round_type, difficulty, overall_score, grade, hiring_decision,
                category_scores, status, questions_answered, total_questions,
                duration_seconds, started_at, completed_at
         FROM mock_sessions WHERE user_id = $1 AND application_id = $2
         ORDER BY created_at DESC`,
        [userId, parseInt(applicationId)]
      );
    } else {
      result = await query(
        `SELECT ms.id, ms.round_type, ms.difficulty, ms.overall_score, ms.grade,
                ms.hiring_decision, ms.status, ms.questions_answered, ms.total_questions,
                ms.duration_seconds, ms.started_at, ms.completed_at,
                a.job_title, a.company
         FROM mock_sessions ms
         JOIN applications a ON a.id = ms.application_id
         WHERE ms.user_id = $1
         ORDER BY ms.created_at DESC LIMIT 20`,
        [userId]
      );
    }

    return NextResponse.json({ success: true, sessions: result.rows });
  } catch (error) {
    logger.error('Mock history failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch mock history' }, { status: 500 });
  }
}
