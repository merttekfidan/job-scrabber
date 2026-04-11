import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { CreateVaultAnswerSchema, validateBody } from '@/lib/validations';
import { standardLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];
    let paramIdx = 2;

    if (category) {
      conditions.push(`category = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }

    if (status) {
      conditions.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    if (search?.trim()) {
      conditions.push(
        `to_tsvector('english', question || ' ' || COALESCE(full_answer, '')) @@ plainto_tsquery('english', $${paramIdx})`
      );
      params.push(search.trim());
      paramIdx++;
    }

    const sql = `SELECT * FROM interview_vault WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC`;
    const result = await query(sql, params);

    return NextResponse.json({ success: true, answers: result.rows });
  } catch (error) {
    logger.error('Vault list failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vault answers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(req, `vault:${userId}`);
    const rlResult = standardLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(CreateVaultAnswerSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const body = validation.data;
    const wordCount = body.fullAnswer.split(/\s+/).filter(Boolean).length;

    const result = await query(
      `INSERT INTO interview_vault (
        user_id, question, category,
        answer_situation, answer_task, answer_action, answer_result, answer_bridge,
        full_answer, key_phrases, strength_signals, adaptation_notes,
        status, word_count, ai_generated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        userId,
        body.question,
        body.category,
        body.answerSituation || null,
        body.answerTask || null,
        body.answerAction || null,
        body.answerResult || null,
        body.answerBridge || null,
        body.fullAnswer,
        JSON.stringify(body.keyPhrases),
        JSON.stringify(body.strengthSignals),
        body.adaptationNotes || null,
        body.status,
        wordCount,
        body.aiGenerated,
      ]
    );

    return NextResponse.json({ success: true, answer: result.rows[0] });
  } catch (error) {
    logger.error('Vault create failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to create vault answer' },
      { status: 500 }
    );
  }
}
