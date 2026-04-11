'use client';

import React, { useState, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { useStartMockSession, useSubmitMockAnswer, useEndMockSession } from '@/hooks/use-mock';
import { MockSessionSetup } from './MockSessionSetup';
import { MockSessionInterface } from './MockSessionInterface';
import { MockScorecard } from './MockScorecard';
import type { MockDifficulty, MockRoundType, MockSessionDebrief, MockInterviewPlan } from '@/types/mock';

type MockPanelProps = {
  applicationId: number;
  defaultRoundType?: MockRoundType;
};

type Phase = 'setup' | 'session' | 'scorecard';

export const MockPanel = ({ applicationId, defaultRoundType = 'Technical' }: MockPanelProps) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [firstQuestion, setFirstQuestion] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [interviewPlan, setInterviewPlan] = useState<MockInterviewPlan | null>(null);
  const [debrief, setDebrief] = useState<MockSessionDebrief | null>(null);

  const startMutation = useStartMockSession();
  const submitMutation = useSubmitMockAnswer();
  const endMutation = useEndMockSession();

  const handleStart = useCallback(async (roundType: MockRoundType, difficulty: MockDifficulty) => {
    try {
      const res = await startMutation.mutateAsync({ applicationId, roundType, difficulty });
      if (res.success) {
        setSessionId(res.sessionId);
        setFirstQuestion(res.firstQuestion);
        setTotalQuestions(res.totalQuestions);
        setInterviewPlan(res.interviewPlan);
        setPhase('session');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start mock session. Please try again.');
    }
  }, [startMutation, applicationId]);

  const handleSubmitAnswer = useCallback(async (questionIndex: number, answer: string) => {
    if (!sessionId) throw new Error('No session');
    const res = await submitMutation.mutateAsync({ sessionId, questionIndex, userAnswer: answer });
    return {
      nextQuestion: res.nextQuestion,
      isLastQuestion: res.isLastQuestion,
      questionsAnswered: res.questionsAnswered,
    };
  }, [sessionId, submitMutation]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await endMutation.mutateAsync(sessionId);
      if (res.success) {
        setDebrief(res.debrief);
        setPhase('scorecard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate scorecard. Please try again.');
    }
  }, [sessionId, endMutation]);

  const handleStartNew = useCallback(() => {
    setPhase('setup');
    setSessionId(null);
    setFirstQuestion('');
    setTotalQuestions(0);
    setInterviewPlan(null);
    setDebrief(null);
    startMutation.reset();
    submitMutation.reset();
    endMutation.reset();
  }, [startMutation, submitMutation, endMutation]);

  return (
    <div className="bg-gray-800/20 rounded-xl border border-gray-700/40 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/40">
        <Mic size={14} className="text-purple-400" />
        <span className="text-sm font-bold text-white">Mock Interview</span>
        {phase === 'session' && interviewPlan && (
          <span className="ml-auto text-xs text-gray-500">{totalQuestions} questions</span>
        )}
      </div>

      {phase === 'setup' && (
        <MockSessionSetup
          onStart={handleStart}
          isPending={startMutation.isPending}
          defaultRoundType={defaultRoundType}
        />
      )}

      {phase === 'session' && sessionId && (
        <MockSessionInterface
          sessionId={sessionId}
          firstQuestion={firstQuestion}
          totalQuestions={totalQuestions}
          onSubmitAnswer={handleSubmitAnswer}
          onEndSession={handleEndSession}
          isSubmitting={submitMutation.isPending}
          isEnding={endMutation.isPending}
        />
      )}

      {phase === 'scorecard' && debrief && (
        <MockScorecard debrief={debrief} onStartNew={handleStartNew} />
      )}
    </div>
  );
};
