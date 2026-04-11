'use client';

import React, { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import type { OnboardingQuestion, OnboardingAnswer } from '@/types/onboarding';

type QuestionsStepProps = {
  questions: OnboardingQuestion[];
  onComplete: (answers: OnboardingAnswer[]) => void;
  isSubmitting: boolean;
};

export const QuestionsStep = ({ questions, onComplete, isSubmitting }: QuestionsStepProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const formatted: OnboardingAnswer[] = questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: answers[q.id] || '',
    }));
    onComplete(formatted);
  };

  const allAnswered = questions.every((q) => (answers[q.id] || '').trim().length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">A Few Quick Questions</h2>
        <p className="mt-2 text-gray-400">
          Help us understand you better so our analysis is spot-on.
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{q.question}</p>
                <p className="mt-0.5 text-xs text-gray-500">{q.purpose}</p>
              </div>
            </div>

            {q.inputType === 'select' && q.options ? (
              <div className="ml-9 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange(q.id, opt)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      answers[q.id] === opt
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                    aria-pressed={answers[q.id] === opt}
                    tabIndex={0}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Your answer..."
                rows={3}
                className="ml-9 w-[calc(100%-2.25rem)] resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-indigo-500"
                aria-label={`Answer to: ${q.question}`}
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isSubmitting}
        className="mx-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Complete onboarding"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <MessageSquare size={16} />
            Complete Setup
          </>
        )}
      </button>
    </div>
  );
};
