import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { MOCK_EVALUATE_ANSWER_PROMPT } from '@/lib/ai/prompts';
import { MockSubmitAnswerSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import type { MockInterviewPlan, MockQuestionPlan, MockQA } from '@/types/mock';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(req, `ai:${userId}`);
    const rlResult = aiLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
    }

    const rawBody = await req.json();
    const validation = validateBody(MockSubmitAnswerSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { sessionId, questionIndex, userAnswer } = validation.data;

    const sessionResult = await query(
      'SELECT interview_plan, questions_and_answers, total_questions, status FROM mock_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const mockSession = sessionResult.rows[0] as {
      interview_plan: MockInterviewPlan;
      questions_and_answers: MockQA[];
      total_questions: number;
      status: string;
    };

    if (mockSession.status !== 'in_progress') {
      return NextResponse.json({ success: false, error: 'Session is not in progress' }, { status: 400 });
    }

    const plan = mockSession.interview_plan;
    const currentQuestion: MockQuestionPlan = plan.questions[questionIndex];
    if (!currentQuestion) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    const prompt = MOCK_EVALUATE_ANSWER_PROMPT(
      currentQuestion.question,
      userAnswer,
      currentQuestion.idealAnswerSignals,
      currentQuestion.type
    );

    const aiResponse = await callGroqAPI(prompt, 0.2, userId);
    const evaluation = parseAIResponse(aiResponse) as Record<string, unknown>;

    const existingQAs: MockQA[] = Array.isArray(mockSession.questions_and_answers)
      ? mockSession.questions_and_answers
      : [];

    const newQA: MockQA = {
      question: currentQuestion,
      userAnswer,
      evaluation: evaluation as MockQA['evaluation'],
    };

    const updatedQAs = [...existingQAs];
    updatedQAs[questionIndex] = newQA;
    const questionsAnswered = updatedQAs.length;
    const isLastQuestion = questionIndex >= mockSession.total_questions - 1;

    await query(
      `UPDATE mock_sessions SET questions_and_answers = $1, questions_answered = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [JSON.stringify(updatedQAs), questionsAnswered, sessionId]
    );

    const nextQuestion = !isLastQuestion ? plan.questions[questionIndex + 1] : null;
    const nextQuestionText = isLastQuestion
      ? plan.closingPrompt
      : (evaluation.nextQuestion as string) || nextQuestion?.question || '';

    return NextResponse.json({
      success: true,
      evaluation,
      nextQuestion: nextQuestionText,
      isLastQuestion,
      questionsAnswered,
      totalQuestions: mockSession.total_questions,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Mock submit failed', { error: msg });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
