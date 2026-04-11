import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { CreateDebriefSchema, validateBody } from '@/lib/validations';
import logger from '@/lib/logger';
import type { DebriefQuestion } from '@/types/debrief';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rawBody = await req.json();
    const validation = validateBody(CreateDebriefSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const {
      applicationId, roundIndex, roundType, interviewDate,
      overallFeeling, interviewerVibe, generalNotes, questions, outcome,
    } = validation.data;

    // Verify the application belongs to this user
    const appCheck = await query(
      'SELECT id FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // Attach stable IDs to each question
    const questionsWithIds: DebriefQuestion[] = questions.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
    }));

    const upsertSql = `
      INSERT INTO interview_debriefs (
        user_id, application_id, round_index, round_type, interview_date,
        overall_feeling, interviewer_vibe, general_notes, questions, outcome
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (application_id, round_index)
      DO UPDATE SET
        round_type = EXCLUDED.round_type,
        interview_date = EXCLUDED.interview_date,
        overall_feeling = EXCLUDED.overall_feeling,
        interviewer_vibe = EXCLUDED.interviewer_vibe,
        general_notes = EXCLUDED.general_notes,
        questions = EXCLUDED.questions,
        outcome = EXCLUDED.outcome,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`;

    const result = await query(upsertSql, [
      userId,
      applicationId,
      roundIndex,
      roundType,
      interviewDate ?? null,
      overallFeeling,
      interviewerVibe ?? null,
      generalNotes ?? null,
      JSON.stringify(questionsWithIds),
      outcome ?? null,
    ]);

    return NextResponse.json({ success: true, debrief: result.rows[0] });
  } catch (error) {
    logger.error('Debrief save failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to save debrief' }, { status: 500 });
  }
}
