import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { UpdateVaultAnswerSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';
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

    const rlKey = getRateLimitKey(req, `vault:${userId}`);
    const rlResult = standardLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(UpdateVaultAnswerSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const existing = await query(
      'SELECT id FROM interview_vault WHERE id = $1 AND user_id = $2',
      [Number(id), userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const body = validation.data;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    const fieldMap: Record<string, string> = {
      question: 'question',
      category: 'category',
      answerSituation: 'answer_situation',
      answerTask: 'answer_task',
      answerAction: 'answer_action',
      answerResult: 'answer_result',
      answerBridge: 'answer_bridge',
      fullAnswer: 'full_answer',
      adaptationNotes: 'adaptation_notes',
      status: 'status',
      aiGenerated: 'ai_generated',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      const val = body[camel as keyof typeof body];
      if (val !== undefined) {
        setClauses.push(`${snake} = $${paramIdx}`);
        values.push(val);
        paramIdx++;
      }
    }

    if (body.keyPhrases !== undefined) {
      setClauses.push(`key_phrases = $${paramIdx}`);
      values.push(JSON.stringify(body.keyPhrases));
      paramIdx++;
    }

    if (body.strengthSignals !== undefined) {
      setClauses.push(`strength_signals = $${paramIdx}`);
      values.push(JSON.stringify(body.strengthSignals));
      paramIdx++;
    }

    if (body.fullAnswer) {
      const wordCount = body.fullAnswer.split(/\s+/).filter(Boolean).length;
      setClauses.push(`word_count = $${paramIdx}`);
      values.push(wordCount);
      paramIdx++;
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    if (setClauses.length === 1) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(Number(id));
    values.push(userId);

    const result = await query(
      `UPDATE interview_vault SET ${setClauses.join(', ')} WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1} RETURNING *`,
      values
    );

    return NextResponse.json({ success: true, answer: result.rows[0] });
  } catch (error) {
    logger.error('Vault update failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to update vault answer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await query(
      'DELETE FROM interview_vault WHERE id = $1 AND user_id = $2 RETURNING id',
      [Number(id), userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Vault delete failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to delete vault answer' },
      { status: 500 }
    );
  }
}
